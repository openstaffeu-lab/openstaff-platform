import ProjectWorkspaceForm from "../../../../components/projects/ProjectWorkspaceForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectWorkspaceForm mode="edit" projectId={id} />;
}
