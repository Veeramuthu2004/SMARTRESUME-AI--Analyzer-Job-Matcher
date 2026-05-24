import { Card } from "../components/ui/Card";

export const AboutPage = () => (
  <div className="space-y-4">
    <div>
      <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
        About
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Built to help candidates turn resume data into actionable career
        insights.
      </p>
    </div>
    <Card>
      <div className="space-y-3 text-slate-700 dark:text-slate-200">
        <p>
          SmartResumeAI helps professionals optimize resumes with ATS
          intelligence, skill-gap detection, AI recommendations, and interview
          coaching.
        </p>
        <p>
          The platform is designed for fast feedback, readable reports, and a
          clean workflow from upload to analysis.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="font-semibold text-slate-950 dark:text-white">
              ATS Scoring
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              See how your resume matches a role in seconds.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="font-semibold text-slate-950 dark:text-white">
              Skill Insights
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Spot missing skills and improve your fit.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="font-semibold text-slate-950 dark:text-white">
              Interview Prep
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Prepare with generated questions and tips.
            </p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);
