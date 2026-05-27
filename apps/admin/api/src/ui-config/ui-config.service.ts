import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PUBLIC_UI_CONFIG,
  PUBLIC_UI_CONFIG_KEY,
  PublicUiConfig,
  UiFooterColumn,
  UiLink,
} from './default-ui-config';

type PublicUiConfigInput = {
  header?: Partial<PublicUiConfig['header']>;
  footer?: Partial<PublicUiConfig['footer']>;
  branding?: Partial<PublicUiConfig['branding']>;
};

@Injectable()
export class UiConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicConfig() {
    try {
      const record = await this.prisma.uiConfig.findUnique({
        where: { key: PUBLIC_UI_CONFIG_KEY },
      });

      if (!record) {
        return {
          config: DEFAULT_PUBLIC_UI_CONFIG,
          source: 'placeholder' as const,
        };
      }

      return {
        config: this.mergeWithDefaults(record),
        source: 'database' as const,
      };
    } catch (error) {
      if (!this.isUiConfigStorageError(error)) {
        console.error('UiConfigService.getPublicConfig', error);
      }

      return {
        config: DEFAULT_PUBLIC_UI_CONFIG,
        source: 'placeholder' as const,
      };
    }
  }

  async updatePublicConfig(config: PublicUiConfigInput) {
    const currentConfig = await this.getPublicConfig();
    const nextConfig = mergeUiConfig(currentConfig.config, config);

    try {
      const record = await this.prisma.uiConfig.upsert({
        where: { key: PUBLIC_UI_CONFIG_KEY },
        update: {
          header: nextConfig.header as Prisma.InputJsonValue,
          homepage: Prisma.JsonNull,
          footer: nextConfig.footer as Prisma.InputJsonValue,
          branding: nextConfig.branding as Prisma.InputJsonValue,
        },
        create: {
          key: PUBLIC_UI_CONFIG_KEY,
          header: nextConfig.header as Prisma.InputJsonValue,
          homepage: Prisma.JsonNull,
          footer: nextConfig.footer as Prisma.InputJsonValue,
          branding: nextConfig.branding as Prisma.InputJsonValue,
        },
      });

      return {
        config: this.mergeWithDefaults(record),
        source: 'database' as const,
      };
    } catch (error) {
      if (!this.isUiConfigStorageError(error)) {
        console.error('UiConfigService.updatePublicConfig', error);
        throw error;
      }

      return {
        config: nextConfig,
        source: 'placeholder' as const,
      };
    }
  }

  private mergeWithDefaults(record: {
    header: Prisma.JsonValue;
    footer: Prisma.JsonValue;
    branding: Prisma.JsonValue;
  }): PublicUiConfig {
    return mergeUiConfig(DEFAULT_PUBLIC_UI_CONFIG, {
      header: normalizeHeader(record.header),
      footer: normalizeFooter(record.footer),
      branding: normalizeBranding(record.branding),
    });
  }

  private isUiConfigStorageError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2021', 'P2022'].includes(error.code))
    );
  }
}

function normalizeHeader(
  value: Prisma.JsonValue,
): Partial<PublicUiConfig['header']> {
  const header = normalizeObject(value);

  return {
    logoDataUrl:
      typeof header.logoDataUrl === 'string' ? header.logoDataUrl : '',
    logoAlt: typeof header.logoAlt === 'string' ? header.logoAlt : '',
    menu: normalizeLinks(header.menu),
  };
}

function normalizeFooter(
  value: Prisma.JsonValue,
): Partial<PublicUiConfig['footer']> {
  const footer = normalizeObject(value);

  return {
    logoDataUrl:
      typeof footer.logoDataUrl === 'string' ? footer.logoDataUrl : '',
    logoAlt: typeof footer.logoAlt === 'string' ? footer.logoAlt : '',
    columns: normalizeColumns(footer.columns),
    bottomText: typeof footer.bottomText === 'string' ? footer.bottomText : '',
  };
}

function normalizeBranding(
  value: Prisma.JsonValue,
): Partial<PublicUiConfig['branding']> {
  const branding = normalizeObject(value);

  return {
    primaryColor:
      typeof branding.primaryColor === 'string' ? branding.primaryColor : '',
    accentColor:
      typeof branding.accentColor === 'string' ? branding.accentColor : '',
    backgroundColor:
      typeof branding.backgroundColor === 'string'
        ? branding.backgroundColor
        : '',
    textColor: typeof branding.textColor === 'string' ? branding.textColor : '',
  };
}

function normalizeObject(value: Prisma.JsonValue) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeLinks(value: unknown): UiLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const link = item as Record<string, unknown>;
      if (typeof link.label !== 'string' || typeof link.href !== 'string') {
        return null;
      }

      return {
        label: link.label,
        href: link.href,
      };
    })
    .filter((item): item is UiLink => item !== null);
}

function normalizeColumns(value: unknown): UiFooterColumn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const column = item as Record<string, unknown>;
      if (typeof column.title !== 'string') {
        return null;
      }

      return {
        title: column.title,
        links: normalizeLinks(column.links),
      };
    })
    .filter((item): item is UiFooterColumn => item !== null);
}

function mergeUiConfig(
  base: PublicUiConfig,
  incoming: PublicUiConfigInput,
): PublicUiConfig {
  return {
    header: {
      ...base.header,
      ...(incoming.header ?? {}),
      menu: Array.isArray(incoming.header?.menu)
        ? normalizeLinks(incoming.header.menu)
        : base.header.menu,
    },
    footer: {
      ...base.footer,
      ...(incoming.footer ?? {}),
      columns: Array.isArray(incoming.footer?.columns)
        ? normalizeColumns(incoming.footer.columns)
        : base.footer.columns,
    },
    branding: {
      ...base.branding,
      ...(incoming.branding ?? {}),
    },
  };
}
