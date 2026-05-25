"use client";
/* eslint-disable @next/next/no-img-element */

import EscoMultiSelect from "@/components/EscoMultiSelect";
import NaceSearchInput from "@/components/NaceSearchInput";
import UniclassMultiSelect from "@/components/UniclassMultiSelect";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  apiRequest,
  apiRequestBlob,
  getLanguages,
  requestEmailOwnershipVerification,
  resolveAssetUrl,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { loginPathForCurrentLocation } from "@/lib/auth-redirect";

type ProfileType =
  | "CONTRACTOR"
  | "SUBCONTRACTOR"
  | "PROFESSIONAL"
  | "INVESTOR"
  | "TRAINING_COMPANY"
  | "SUPERVISOR"
  | "HSE_SAFETY"
  | "SUPPLIER"
  | "GENERAL_CONTRACTOR";

type ProfileVisibility = "PUBLIC" | "PRIVATE" | "APPROVED_ONLY";
type ProfileLifecycleStatus = "LIVE" | "OFFLINE" | "SUSPENDED";
type ProfileAvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
type ProfileDocumentType = "CV" | "CERTIFICATION" | "PORTFOLIO" | "IMAGE" | "VIDEO" | "LICENSE" | "OTHER";
type ProfileAssetKind = "LOGO" | "PHOTO" | "BANNER" | "CV" | "PORTFOLIO";

type TaxonomyOption = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
};

type LanguageOption = {
  id: string;
  code: string;
  name: string;
};

type CountryOption = {
  id: string;
  code: string;
  name: string;
  regions: Array<{
    id: string;
    name: string;
    cities: Array<{ id: string; name: string }>;
  }>;
};

type ProfileDocument = {
  id: string;
  type: ProfileDocumentType;
  assetKind: ProfileAssetKind | null;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  extractionStatus: string;
  extractionError: string | null;
  urls: {
    download: string;
    asset: string | null;
  };
};

type ProfileResponse = {
  id: string;
  slug: string;
  profileType: ProfileType;
  displayName: string;
  companyName: string | null;
  publicHeadline: string | null;
  description: string | null;
  summary: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  privateEmail: string | null;
  privatePhone: string | null;
  privateNotes: string | null;
  companyRegistrationNumber: string | null;
  taxNumber: string | null;
  visibility: ProfileVisibility;
  moderationStatus: string;
  status: ProfileLifecycleStatus;
  supportedEngagementModels: string[];
  certificationsText: string | null;
  availabilityStatus: ProfileAvailabilityStatus;
  rating: number | null;
  geography: {
    country: CountryOption | null;
    region: CountryOption["regions"][number] | null;
    city: CountryOption["regions"][number]["cities"][number] | null;
  };
  contractorProfile: {
    tradeFocus: string | null;
    teamSize: number | null;
    serviceArea: string | null;
  } | null;
  professionalProfile: {
    headline: string | null;
    yearsExperience: number | null;
    portfolioFocus: string | null;
  } | null;
  languages: Array<{ id: string; code: string; name: string }>;
  escoSkills: TaxonomyOption[];
  naceCodes: TaxonomyOption[];
  uniclassCodes: TaxonomyOption[];
  languageCodes: string[];
  escoCodes: string[];
  naceCodeValues: string[];
  uniclassCodeValues: string[];
  assets: {
    logoUrl: string | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    cvUrl: string | null;
    portfolioUrls: string[];
  };
  documents: ProfileDocument[];
};

type FormState = {
  slug: string;
  profileType: ProfileType;
  displayName: string;
  companyName: string;
  publicHeadline: string;
  summary: string;
  description: string;
  websiteUrl: string;
  publicEmail: string;
  publicPhone: string;
  privateEmail: string;
  privatePhone: string;
  privateNotes: string;
  companyRegistrationNumber: string;
  taxNumber: string;
  visibility: ProfileVisibility;
  countryId: string;
  regionId: string;
  cityId: string;
  supportedEngagementModels: string[];
  certificationsText: string;
  availabilityStatus: ProfileAvailabilityStatus;
  languageCodes: string[];
  escoCodes: string[];
  naceCodes: string[];
  uniclassCodes: string[];
  contractorProfile: {
    tradeFocus: string;
    teamSize: string;
    serviceArea: string;
  };
  professionalProfile: {
    headline: string;
    yearsExperience: string;
    portfolioFocus: string;
  };
};

const PROFILE_TYPES: Array<{ value: ProfileType; label: string }> = [
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "INVESTOR", label: "Investor" },
  { value: "TRAINING_COMPANY", label: "Training Company" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "HSE_SAFETY", label: "HSE / Safety" },
  { value: "SUPPLIER", label: "Supplier" },
];

const VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string }> = [
  { value: "PRIVATE", label: "Private" },
  { value: "APPROVED_ONLY", label: "Approved Only" },
  { value: "PUBLIC", label: "Public" },
];

const AVAILABILITY_OPTIONS: ProfileAvailabilityStatus[] = ["AVAILABLE", "LIMITED", "UNAVAILABLE"];
const ENGAGEMENT_OPTIONS = ["B2B", "B2C", "MIXED"];
const ASSET_OPTIONS: Array<{ assetKind: ProfileAssetKind; type: ProfileDocumentType; label: string }> = [
  { assetKind: "LOGO", type: "IMAGE", label: "Logo" },
  { assetKind: "PHOTO", type: "IMAGE", label: "Photo" },
  { assetKind: "BANNER", type: "IMAGE", label: "Banner" },
  { assetKind: "CV", type: "CV", label: "CV" },
  { assetKind: "PORTFOLIO", type: "PORTFOLIO", label: "Portfolio" },
];

const EMPTY_FORM: FormState = {
  slug: "",
  profileType: "CONTRACTOR",
  displayName: "",
  companyName: "",
  publicHeadline: "",
  summary: "",
  description: "",
  websiteUrl: "",
  publicEmail: "",
  publicPhone: "",
  privateEmail: "",
  privatePhone: "",
  privateNotes: "",
  companyRegistrationNumber: "",
  taxNumber: "",
  visibility: "PRIVATE",
  countryId: "",
  regionId: "",
  cityId: "",
  supportedEngagementModels: ["B2B"],
    certificationsText: "",
    availabilityStatus: "AVAILABLE",
    languageCodes: [],
    escoCodes: [],
    naceCodes: [],
    uniclassCodes: [],
    contractorProfile: {
    tradeFocus: "",
    teamSize: "",
    serviceArea: "",
  },
  professionalProfile: {
    headline: "",
    yearsExperience: "",
    portfolioFocus: "",
  },
};

function usesProfessionalFields(profileType: ProfileType) {
  return (
    profileType === "PROFESSIONAL" ||
    profileType === "INVESTOR" ||
    profileType === "TRAINING_COMPANY" ||
    profileType === "SUPERVISOR" ||
    profileType === "HSE_SAFETY"
  );
}

function syncForm(profile: ProfileResponse): FormState {
  return {
    slug: profile.slug,
    profileType: profile.profileType,
    displayName: profile.displayName,
    companyName: profile.companyName ?? "",
    publicHeadline: profile.publicHeadline ?? "",
    summary: profile.summary ?? "",
    description: profile.description ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    publicEmail: profile.publicEmail ?? "",
    publicPhone: profile.publicPhone ?? "",
    privateEmail: profile.privateEmail ?? "",
    privatePhone: profile.privatePhone ?? "",
    privateNotes: profile.privateNotes ?? "",
    companyRegistrationNumber: profile.companyRegistrationNumber ?? "",
    taxNumber: profile.taxNumber ?? "",
    visibility: profile.visibility,
    countryId: profile.geography.country?.id ?? "",
    regionId: profile.geography.region?.id ?? "",
    cityId: profile.geography.city?.id ?? "",
    supportedEngagementModels: profile.supportedEngagementModels,
    certificationsText: profile.certificationsText ?? "",
    availabilityStatus: profile.availabilityStatus,
    languageCodes: profile.languages.map((item) => item.code),
    escoCodes: profile.escoSkills.map((item) => item.code),
    naceCodes: profile.naceCodes.map((item) => item.code),
    uniclassCodes: profile.uniclassCodes.map((item) => item.code),
    contractorProfile: {
      tradeFocus: profile.contractorProfile?.tradeFocus ?? "",
      teamSize: profile.contractorProfile?.teamSize?.toString() ?? "",
      serviceArea: profile.contractorProfile?.serviceArea ?? "",
    },
    professionalProfile: {
      headline: profile.professionalProfile?.headline ?? "",
      yearsExperience: profile.professionalProfile?.yearsExperience?.toString() ?? "",
      portfolioFocus: profile.professionalProfile?.portfolioFocus ?? "",
    },
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, isReady, logout, user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [escoSkills, setEscoSkills] = useState<TaxonomyOption[]>([]);
  const [naceCodes, setNaceCodes] = useState<TaxonomyOption[]>([]);
  const [uniclassCodes, setUniclassCodes] = useState<TaxonomyOption[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ProfileAssetKind>("LOGO");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === form.countryId) ?? null,
    [countries, form.countryId],
  );
  const selectedRegion = useMemo(
    () => selectedCountry?.regions.find((region) => region.id === form.regionId) ?? null,
    [selectedCountry, form.regionId],
  );

  async function loadProfileWorkspace(authToken: string) {
    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, countriesResponse, languagesResponse, escoResponse, naceResponse, uniclassResponse] =
        await Promise.all([
          apiRequest<ProfileResponse | null>("/profile", { token: authToken }),
          apiRequest<CountryOption[]>("/countries", { token: authToken }),
          getLanguages(),
          apiRequest<TaxonomyOption[]>("/esco", { token: authToken }),
          apiRequest<TaxonomyOption[]>("/nace", { token: authToken }),
          apiRequest<TaxonomyOption[]>("/uniclass", { token: authToken }),
        ]);

      if (profileResponse) {
        setProfile(profileResponse);
        setForm(syncForm(profileResponse));
      } else {
        setProfile(null);
        setForm(EMPTY_FORM);
      }

      setCountries(countriesResponse);
      setLanguages(languagesResponse);
      setEscoSkills(escoResponse);
      setNaceCodes(naceResponse);
      setUniclassCodes(uniclassResponse);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        router.push(loginPathForCurrentLocation());
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load your profile workspace.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push(loginPathForCurrentLocation());
      return;
    }

    void loadProfileWorkspace(token);
  }, [isReady, router, token]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleLanguage(code: string) {
    setForm((current) => ({
      ...current,
      languageCodes: current.languageCodes.includes(code)
        ? current.languageCodes.filter((entry) => entry !== code)
        : [...current.languageCodes, code],
    }));
  }

  function toggleArrayValue(key: "supportedEngagementModels", value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value],
    }));
  }

  async function handleSave() {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        slug: form.slug,
        profileType: form.profileType,
        displayName: form.displayName,
        companyName: form.companyName || null,
        publicHeadline: form.publicHeadline || null,
        summary: form.summary || null,
        description: form.description || null,
        websiteUrl: form.websiteUrl || null,
        publicEmail: form.publicEmail || null,
        publicPhone: form.publicPhone || null,
        privateEmail: form.privateEmail || null,
        privatePhone: form.privatePhone || null,
        privateNotes: form.privateNotes || null,
        companyRegistrationNumber: form.companyRegistrationNumber || null,
        taxNumber: form.taxNumber || null,
        visibility: form.visibility,
        countryId: form.countryId || null,
        regionId: form.regionId || null,
        cityId: form.cityId || null,
        countryName: selectedCountry?.name ?? null,
        countryCode: selectedCountry?.code ?? null,
        regionName: selectedRegion?.name ?? null,
        cityName:
          selectedRegion?.cities.find((city) => city.id === form.cityId)?.name ?? null,
        supportedEngagementModels: form.supportedEngagementModels,
        certificationsText: form.certificationsText || null,
        availabilityStatus: form.availabilityStatus,
        languageCodes: form.languageCodes,
        escoCodes: form.escoCodes,
        naceCodes: form.naceCodes,
        uniclassCodes: form.uniclassCodes,
        contractorProfile: !usesProfessionalFields(form.profileType)
          ? {
              tradeFocus: form.contractorProfile.tradeFocus || undefined,
              teamSize: form.contractorProfile.teamSize
                ? Number(form.contractorProfile.teamSize)
                : undefined,
              serviceArea: form.contractorProfile.serviceArea || undefined,
            }
          : undefined,
        professionalProfile: usesProfessionalFields(form.profileType)
          ? {
              headline: form.professionalProfile.headline || undefined,
              yearsExperience: form.professionalProfile.yearsExperience
                ? Number(form.professionalProfile.yearsExperience)
                : undefined,
              portfolioFocus: form.professionalProfile.portfolioFocus || undefined,
            }
          : undefined,
      };

      const savedProfile = await apiRequest<ProfileResponse>("/profile", {
        method: "PUT",
        token,
        body: payload,
      });

      setProfile(savedProfile);
      setForm(syncForm(savedProfile));
      setMessage("Profile saved. Your moderation status was refreshed for review.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload() {
    if (!token || !profile || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    const assetMeta = ASSET_OPTIONS.find((item) => item.assetKind === selectedAsset);
    formData.append("file", selectedFile);
    formData.append("assetKind", selectedAsset);
    formData.append("type", assetMeta?.type ?? "OTHER");
    formData.append("title", `${selectedAsset.toLowerCase()}-${selectedFile.name}`);

    try {
      await apiRequest(`/profiles/${profile.id}/documents/upload`, {
        method: "POST",
        token,
        formData,
      });
      await loadProfileWorkspace(token);
      setSelectedFile(null);
      setMessage("Asset uploaded successfully.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleExtract(document: ProfileDocument) {
    if (!token || !profile) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await apiRequest(`/profiles/${profile.id}/documents/${document.id}/extract`, {
        method: "POST",
        token,
      });
      await loadProfileWorkspace(token);
      setMessage(`Extraction started for ${document.title}.`);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Extraction failed.");
    }
  }

  async function handleDownload(document: ProfileDocument) {
    if (!token || !profile) {
      return;
    }

    const blob = await apiRequestBlob(`/profiles/${profile.id}/documents/${document.id}`, {
      token,
    });
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  }

  async function handleDelete(document: ProfileDocument) {
    if (!token || !profile) {
      return;
    }

    try {
      await apiRequest(`/profiles/${profile.id}/documents/${document.id}`, {
        method: "DELETE",
        token,
      });
      await loadProfileWorkspace(token);
      setMessage("Document removed.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  async function handleRequestOwnershipVerification() {
    if (!token) {
      setError("Authentication required.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const response = await requestEmailOwnershipVerification(token);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Verification email failed.");
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (isLoading) {
    return <main className="px-6 py-10 text-slate-600">Loading profile workspace...</main>;
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">Account & Profile</div>
              <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Manage your public profile</h1>
              <p className="mt-4 max-w-3xl text-slate-600">
                Control account approval status, role-based profile details, public and private fields, and media assets used on your public page.
              </p>
            </div>
            {profile?.slug ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleRequestOwnershipVerification()}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800"
                >
                  Send ownership verification email
                </button>
                <Link
                  href="/security"
                  className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-brand-navy"
                >
                  Security & 2FA
                </Link>
                <Link
                  href={`/profiles/${profile.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-navy"
                >
                  Open public page
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatusCard
              label="Account Approval"
              value={user?.approvalStatus ?? "PENDING"}
              tone={user?.approvalStatus === "APPROVED" ? "success" : user?.approvalStatus === "REJECTED" ? "danger" : "warning"}
            />
            <StatusCard
              label="Account Status"
              value={user?.accountStatus ?? "OFFLINE"}
              tone={user?.accountStatus === "LIVE" ? "success" : user?.accountStatus === "SUSPENDED" ? "danger" : "neutral"}
            />
            <StatusCard
              label="Profile Moderation"
              value={profile?.moderationStatus ?? "PENDING"}
              tone={profile?.moderationStatus === "APPROVED" ? "success" : profile?.moderationStatus === "REJECTED" ? "danger" : "warning"}
            />
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <Panel title="Profile Basics" description="Role, slug, public identity, and moderation-facing visibility.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Display name">
                  <input className={inputClassName} value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} />
                </Field>
                <Field label="Company name">
                  <input className={inputClassName} value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} />
                </Field>
                <Field label="Slug">
                  <input className={inputClassName} value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
                </Field>
                <Field label="Profile role">
                  <select className={inputClassName} value={form.profileType} onChange={(event) => updateField("profileType", event.target.value as ProfileType)}>
                    {PROFILE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Visibility">
                  <select className={inputClassName} value={form.visibility} onChange={(event) => updateField("visibility", event.target.value as ProfileVisibility)}>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Availability">
                  <select className={inputClassName} value={form.availabilityStatus} onChange={(event) => updateField("availabilityStatus", event.target.value as ProfileAvailabilityStatus)}>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Public headline">
                  <input className={inputClassName} value={form.publicHeadline} onChange={(event) => updateField("publicHeadline", event.target.value)} />
                </Field>
                <Field label="Website">
                  <input className={inputClassName} value={form.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} />
                </Field>
                <Field label="Public email">
                  <input className={inputClassName} value={form.publicEmail} onChange={(event) => updateField("publicEmail", event.target.value)} />
                </Field>
                <Field label="Public phone">
                  <input className={inputClassName} value={form.publicPhone} onChange={(event) => updateField("publicPhone", event.target.value)} />
                </Field>
                <Field label="Private email">
                  <input className={inputClassName} value={form.privateEmail} onChange={(event) => updateField("privateEmail", event.target.value)} />
                </Field>
                <Field label="Private phone">
                  <input className={inputClassName} value={form.privatePhone} onChange={(event) => updateField("privatePhone", event.target.value)} />
                </Field>
                <Field label="Company registration number">
                  <input className={inputClassName} value={form.companyRegistrationNumber} onChange={(event) => updateField("companyRegistrationNumber", event.target.value)} />
                </Field>
                <Field label="Tax number">
                  <input className={inputClassName} value={form.taxNumber} onChange={(event) => updateField("taxNumber", event.target.value)} />
                </Field>
                <Field label="Summary" className="md:col-span-2">
                  <textarea className={textareaClassName} value={form.summary} onChange={(event) => updateField("summary", event.target.value)} />
                </Field>
                <Field label="Description" className="md:col-span-2">
                  <textarea className={textareaClassName} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
                </Field>
                <Field label="Private notes" className="md:col-span-2">
                  <textarea className={textareaClassName} value={form.privateNotes} onChange={(event) => updateField("privateNotes", event.target.value)} />
                </Field>
              </div>
            </Panel>

            <Panel title="Location & Commercial Scope" description="Geography and engagement models used in discovery and matching.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Country">
                  <select
                    className={inputClassName}
                    value={form.countryId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        countryId: event.target.value,
                        regionId: "",
                        cityId: "",
                      }))
                    }
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Region">
                  <select
                    className={inputClassName}
                    value={form.regionId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        regionId: event.target.value,
                        cityId: "",
                      }))
                    }
                  >
                    <option value="">Select region</option>
                    {selectedCountry?.regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="City">
                  <select className={inputClassName} value={form.cityId} onChange={(event) => updateField("cityId", event.target.value)}>
                    <option value="">Select city</option>
                    {selectedRegion?.cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-medium text-slate-600">Engagement models</div>
                <div className="flex flex-wrap gap-3">
                  {ENGAGEMENT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayValue("supportedEngagementModels", option)}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        form.supportedEngagementModels.includes(option)
                          ? "bg-brand-navy text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Classification & Languages" description="Choose the public taxonomy and language metadata that should follow your profile.">
              <div className="space-y-6">
                <Field label="Languages">
                  <div className="flex flex-wrap gap-3">
                    {languages.map((language) => {
                      const selected = form.languageCodes.includes(language.code);
                      return (
                        <button
                          key={language.id}
                          type="button"
                          onClick={() => toggleLanguage(language.code)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            selected
                              ? "bg-brand-navy text-white"
                              : "border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {language.name}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="NACE">
                  <div className="space-y-3">
                    <NaceSearchInput
                      value={form.naceCodes.join(", ")}
                      onChange={(code) =>
                        setForm((current) => ({
                          ...current,
                          naceCodes: current.naceCodes.includes(code)
                            ? current.naceCodes
                            : [...current.naceCodes, code],
                        }))
                      }
                    />
                    <TagGroup
                      label="Selected NACE"
                      items={form.naceCodes.map((code) => {
                        const match = naceCodes.find((item) => item.code === code);
                        return match ? `${match.code} ${match.title}` : code;
                      })}
                      onRemove={(item) => {
                        const code = item.split(" ")[0];
                        setForm((current) => ({
                          ...current,
                          naceCodes: current.naceCodes.filter((entry) => entry !== code),
                        }));
                      }}
                    />
                  </div>
                </Field>

                <Field label="ESCO">
                  <EscoMultiSelect value={form.escoCodes} onChange={(escoCodes) => updateField("escoCodes", escoCodes)} />
                </Field>

                <Field label="Uniclass">
                  <UniclassMultiSelect value={form.uniclassCodes} onChange={(uniclassCodes) => updateField("uniclassCodes", uniclassCodes)} />
                </Field>
              </div>
            </Panel>

            <Panel title="Role-Specific Details" description="Use the profile role to switch between contractor-oriented and professional-oriented content.">
              {usesProfessionalFields(form.profileType) ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Headline">
                    <input className={inputClassName} value={form.professionalProfile.headline} onChange={(event) => setForm((current) => ({ ...current, professionalProfile: { ...current.professionalProfile, headline: event.target.value } }))} />
                  </Field>
                  <Field label="Years of experience">
                    <input className={inputClassName} value={form.professionalProfile.yearsExperience} onChange={(event) => setForm((current) => ({ ...current, professionalProfile: { ...current.professionalProfile, yearsExperience: event.target.value } }))} />
                  </Field>
                  <Field label="Portfolio focus">
                    <input className={inputClassName} value={form.professionalProfile.portfolioFocus} onChange={(event) => setForm((current) => ({ ...current, professionalProfile: { ...current.professionalProfile, portfolioFocus: event.target.value } }))} />
                  </Field>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Trade focus">
                    <input className={inputClassName} value={form.contractorProfile.tradeFocus} onChange={(event) => setForm((current) => ({ ...current, contractorProfile: { ...current.contractorProfile, tradeFocus: event.target.value } }))} />
                  </Field>
                  <Field label="Team size">
                    <input className={inputClassName} value={form.contractorProfile.teamSize} onChange={(event) => setForm((current) => ({ ...current, contractorProfile: { ...current.contractorProfile, teamSize: event.target.value } }))} />
                  </Field>
                  <Field label="Service area">
                    <input className={inputClassName} value={form.contractorProfile.serviceArea} onChange={(event) => setForm((current) => ({ ...current, contractorProfile: { ...current.contractorProfile, serviceArea: event.target.value } }))} />
                  </Field>
                </div>
              )}
            </Panel>

            <Panel title="Documents & Media" description="Upload logo, photo, banner, CV, and portfolio assets.">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Asset kind">
                  <select className={inputClassName} value={selectedAsset} onChange={(event) => setSelectedAsset(event.target.value as ProfileAssetKind)}>
                    {ASSET_OPTIONS.map((option) => (
                      <option key={option.assetKind} value={option.assetKind}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="File">
                  <input
                    type="file"
                    className={inputClassName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setSelectedFile(event.target.files?.[0] ?? null)
                    }
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void handleUpload()}
                    disabled={!selectedFile || !profile || isUploading}
                    className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Images and documents are production-ready in this workspace. Video files are
                accepted only as supporting portfolio evidence and may require manual review before
                operators rely on them as public-facing assets.
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AssetPreview label="Logo" url={profile?.assets.logoUrl ?? null} />
                <AssetPreview label="Photo" url={profile?.assets.photoUrl ?? null} />
                <AssetPreview label="Banner" url={profile?.assets.bannerUrl ?? null} />
              </div>

              <div className="mt-6 space-y-4">
                {profile?.documents.length ? (
                  profile.documents.map((document) => (
                    <div key={document.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-base font-semibold text-brand-charcoal">{document.title}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {document.assetKind ?? document.type} · {document.fileName} · {document.extractionStatus}
                          </div>
                          {document.extractionError ? (
                            <div className="mt-2 text-sm text-rose-600">{document.extractionError}</div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void handleDownload(document)} className={secondaryButtonClassName}>
                            Open
                          </button>
                          <button type="button" onClick={() => void handleExtract(document)} className={secondaryButtonClassName}>
                            Extract
                          </button>
                          <button type="button" onClick={() => void handleDelete(document)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                    No uploads yet.
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <aside className="space-y-8">
            <Panel title="Public Preview" description="What visitors can expect once the profile is approved and live.">
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{form.profileType.replaceAll("_", " ")}</div>
                <div className="mt-3 text-2xl font-semibold text-brand-charcoal">{form.displayName || "Display name"}</div>
                <div className="mt-2 text-sm text-slate-600">{form.publicHeadline || "Public headline"}</div>
                <div className="mt-4 text-sm leading-6 text-slate-600">{form.summary || "Public summary will appear here."}</div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {form.supportedEngagementModels.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-navy">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 text-sm text-slate-500">
                  Visibility: <strong>{form.visibility}</strong>
                </div>
              </div>
            </Panel>

            <Panel title="Taxonomy Snapshot" description="Current classification data already linked to your profile.">
              <TagGroup label="ESCO" items={profile?.escoSkills.map((item) => item.title) ?? []} />
              <TagGroup label="NACE" items={profile?.naceCodes.map((item) => `${item.code} ${item.title}`) ?? []} />
              <TagGroup label="Uniclass" items={profile?.uniclassCodes.map((item) => `${item.code} ${item.title}`) ?? []} />
              <div className="mt-4 text-xs text-slate-500">
                Loaded reference counts: {escoSkills.length} ESCO, {naceCodes.length} NACE, {uniclassCodes.length} Uniclass.
              </div>
            </Panel>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full rounded-[1.7rem] bg-brand-navy px-5 py-4 text-base font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="openstaff-card rounded-[2rem] p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-brand-charcoal">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${toneClassName}`}>
      <div className="text-xs uppercase tracking-[0.28em]">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value.replaceAll("_", " ")}</div>
    </div>
  );
}

function AssetPreview({ label, url }: { label: string; url: string | null }) {
  const resolvedUrl = resolveAssetUrl(url);

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-brand-charcoal">{label}</div>
      {resolvedUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <img src={resolvedUrl} alt={label} className="h-32 w-full object-cover" />
        </div>
      ) : (
        <div className="mt-3 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          No {label.toLowerCase()} uploaded
        </div>
      )}
    </div>
  );
}

function TagGroup({
  label,
  items,
  onRemove,
}: {
  label: string;
  items: string[];
  onRemove?: (item: string) => void;
}) {
  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={onRemove ? () => onRemove(item) : undefined}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
            >
              {item}
              {onRemove ? " x" : ""}
            </button>
          ))
        ) : (
          <span className="text-sm text-slate-400">No items yet.</span>
        )}
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none";
const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none";
const secondaryButtonClassName =
  "rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700";
