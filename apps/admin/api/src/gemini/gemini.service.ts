import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

type GeminiHistory = { role: 'user' | 'model'; parts: string }[];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY ?? '';
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set. Gemini requests will use fallbacks.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getAgentConfig(type: string) {
    return this.prisma.geminiAgent.findFirst({
      where: { type: type as any, enabled: true },
    });
  }

  async callGemini(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.7,
    history: GeminiHistory = [],
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({
      history: history.map((item) => ({
        role: item.role,
        parts: [{ text: item.parts }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }

  async chat(message: string, history: GeminiHistory = [], actorId?: string) {
    const agent = await this.getAgentConfig('CHATBOT_PUBLIC');
    if (!agent) {
      return {
        response:
          'Serviciul AI este temporar indisponibil. Contactati support@openstaff.eu',
        agentName: 'Fallback',
        actorId: actorId ?? null,
      };
    }

    try {
      const response = await this.callGemini(
        agent.systemPrompt,
        message,
        agent.temperature,
        history,
      );
      return { response, agentName: agent.name, actorId: actorId ?? null };
    } catch (error) {
      this.logger.error('Gemini chat error', error as Error);
      return {
        response:
          'Serviciul AI este temporar indisponibil. Contactati support@openstaff.eu',
        agentName: 'Fallback',
        actorId: actorId ?? null,
      };
    }
  }

  async analyzeDocument(fileUrl: string, documentType: string) {
    const agent = await this.getAgentConfig('DOCUMENT_OCR');
    if (!agent) {
      return { error: 'Extragere date esuata', confidence: 0 };
    }

    try {
      const prompt = `Analizeaza documentul de tip ${documentType} de la URL: ${fileUrl}. Extrage toate datele relevante.`;
      const raw = await this.callGemini(agent.systemPrompt, prompt, agent.temperature);
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (error) {
      this.logger.error('Gemini analyzeDocument error', error as Error);
      return { error: 'Extragere date esuata', confidence: 0 };
    }
  }

  async scoreApplication(jobId: string, actorId: string) {
    const [job, actor] = await Promise.all([
      this.prisma.job.findUnique({ where: { id: jobId } }),
      this.prisma.actor.findUnique({
        where: { id: actorId },
        include: { companyProfile: true },
      }),
    ]);

    if (!job || !actor) {
      throw new Error('Job sau actor negasit');
    }

    const agent = await this.getAgentConfig('MATCHING_ENGINE');
    if (!agent) {
      return {
        score: 0,
        reasons: ['Matching agent not configured'],
        recommendation: 'Verificare manuala necesara',
      };
    }

    const prompt = `
JOB: ${job.title}
Categorie: ${job.category}, NACE: ${job.naceCode}
ESCO cerut: ${job.escoRequired.join(', ')}
Buget: ${job.budget} ${job.currency}
Descriere: ${job.description}

CANDIDAT: ${actor.displayName}
NACE: ${actor.naceCode}, ESCO: ${actor.escoOccupations.join(', ')}
Experienta: ${actor.experienceYears} ani, Rating: ${actor.rating}/5
Verificat: ${actor.isVerified}

Calculeaza compatibilitatea si returneaza JSON.`;

    try {
      const raw = await this.callGemini(agent.systemPrompt, prompt, agent.temperature);
      const clean = raw.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);

      await this.prisma.application.updateMany({
        where: { jobId, actorId },
        data: { reluScore: result.score },
      });

      return result;
    } catch (error) {
      this.logger.error('Gemini scoreApplication error', error as Error);
      return {
        score: 0,
        reasons: ['Eroare procesare'],
        recommendation: 'Verificare manuala necesara',
      };
    }
  }

  async generateTestForm(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job negasit');
    }

    const agent = await this.getAgentConfig('TEST_FORM_GENERATOR');
    if (!agent) {
      return { questions: [], error: 'Generare esuata' };
    }

    const prompt = `
Job: ${job.title}
Categorie: ${job.category}
NACE: ${job.naceCode}
ESCO cerut: ${job.escoRequired.join(', ')}
Descriere: ${job.description}

Genereaza formularul de evaluare tehnica.`;

    try {
      const raw = await this.callGemini(agent.systemPrompt, prompt, agent.temperature);
      const clean = raw.replace(/```json|```/g, '').trim();
      const form = JSON.parse(clean);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { reluTestForm: form, reluProcessed: true },
      });

      return form;
    } catch (error) {
      this.logger.error('Gemini generateTestForm error', error as Error);
      return { questions: [], error: 'Generare esuata' };
    }
  }

  async pcbAssist(prompt: string, context?: string) {
    const agent = await this.getAgentConfig('PCB_DESIGN_ASSISTANT');
    if (!agent) {
      return {
        response: 'Serviciul PCB Assistant este temporar indisponibil',
        agentName: 'Fallback',
      };
    }

    const fullPrompt = context ? `Context: ${context}\n\nIntrebare: ${prompt}` : prompt;

    try {
      const response = await this.callGemini(
        agent.systemPrompt,
        fullPrompt,
        agent.temperature,
      );
      return { response, agentName: agent.name };
    } catch (error) {
      this.logger.error('Gemini pcbAssist error', error as Error);
      return {
        response: 'Serviciul PCB Assistant este temporar indisponibil',
        agentName: 'Fallback',
      };
    }
  }

  async generateContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        job: true,
        employer: { include: { companyProfile: true } },
        contractor: { include: { companyProfile: true } },
      },
    });

    if (!contract) {
      throw new Error('Contract negasit');
    }

    const agent = await this.getAgentConfig('CONTRACT_GENERATOR');
    if (!agent) {
      return { error: 'Generare contract esuata', contractId };
    }

    const prompt = `
Angajator: ${contract.employer.displayName}
  CUI: ${contract.employer.companyProfile?.cui || 'N/A'}
  Adresa: ${contract.employer.companyProfile?.adresa || 'N/A'}

Contractor: ${contract.contractor.displayName}
  CUI: ${contract.contractor.companyProfile?.cui || 'N/A'}
  Adresa: ${contract.contractor.companyProfile?.adresa || 'N/A'}

Proiect: ${contract.job.title}
Valoare: ${contract.value} ${contract.currency}
Perioada: ${contract.startDate} - ${contract.endDate}
Fee platforma: ${contract.transactionFee} ${contract.currency} (3%)

Genereaza contractul complet conform legislatiei romane.`;

    try {
      const response = await this.callGemini(agent.systemPrompt, prompt, agent.temperature);
      return { contractMarkdown: response, contractId };
    } catch (error) {
      this.logger.error('Gemini generateContract error', error as Error);
      return { error: 'Generare contract esuata', contractId };
    }
  }

  async complianceCheck(content: string) {
    const agent = await this.getAgentConfig('COMPLIANCE_MONITOR');
    if (!agent) {
      return { issues: [], risk_level: 'UNKNOWN', recommendations: [] };
    }

    try {
      const raw = await this.callGemini(agent.systemPrompt, content, agent.temperature);
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (error) {
      this.logger.error('Gemini complianceCheck error', error as Error);
      return { issues: [], risk_level: 'UNKNOWN', recommendations: [] };
    }
  }

  async listAgents() {
    return this.prisma.geminiAgent.findMany({
      orderBy: { type: 'asc' },
    });
  }

  async updateAgent(
    id: string,
    data: Partial<{
      systemPrompt: string;
      temperature: number;
      enabled: boolean;
      webhookUrl: string;
    }>,
  ) {
    return this.prisma.geminiAgent.update({
      where: { id },
      data,
    });
  }
}
