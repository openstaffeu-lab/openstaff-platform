type Project = {
  id: string;
  name: string;
  location: string;
  status: string;
  createdAt: string;
};

async function getProjects(): Promise<Project[]> {
  const res = await fetch("http://localhost:3002/projects", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }

  return res.json();
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-6 md:p-8">
      <section className="mb-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">Projects</div>
        <h2 className="mt-2 text-3xl font-semibold">Project Portfolio</h2>
        <p className="mt-2 text-sm text-slate-400">
          Live data from backend API
        </p>
      </section>

      <div className="bg-slate-900 p-6 rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="p-4">{p.name}</td>
                <td className="p-4">{p.location}</td>
                <td className="p-4">{p.status}</td>
                <td className="p-4">
                  {new Date(p.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-slate-400">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}