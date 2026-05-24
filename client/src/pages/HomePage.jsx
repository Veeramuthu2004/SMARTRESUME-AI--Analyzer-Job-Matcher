import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, BadgeCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

const features = [
  {
    title: "ATS Scoring Engine",
    icon: BadgeCheck,
    desc: "Score resumes with detailed keyword and formatting intelligence.",
  },
  {
    title: "AI Resume Coach",
    icon: BrainCircuit,
    desc: "Get personalized improvement suggestions and cover letters instantly.",
  },
  {
    title: "Smart Job Matching",
    icon: Sparkles,
    desc: "Semantic matching and skill-gap analysis for every application.",
  },
];

export const HomePage = () => {
  return (
    <div className="space-y-14 pb-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white/75 via-cyan-50/70 to-blue-50/60 p-6 shadow-xl md:p-10 dark:border-slate-800 dark:from-slate-900/75 dark:via-slate-900/70 dark:to-cyan-950/30">
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-0 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-700 dark:text-cyan-200">
            Premium AI Career Platform
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl dark:text-white">
            Smart Resume Analyzer &{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Job Matcher
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-slate-700 dark:text-slate-300">
            Upload your resume, paste any job description, and get ATS scoring,
            skill-gap analysis, personalized recommendations, and interview prep
            in one beautiful dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <Button size="lg">
                Start Free <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card className="h-full">
              <feature.icon className="mb-3 text-cyan-300" size={20} />
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {feature.desc}
              </p>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-6 md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/55">
        {[
          ["50K+", "Resumes analyzed"],
          ["92%", "Avg ATS improvement"],
          ["10x", "Faster job targeting"],
          ["4.9/5", "User satisfaction"],
        ].map(([metric, label]) => (
          <div
            key={metric}
            className="rounded-2xl bg-white/85 p-4 dark:bg-slate-900/70"
          >
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {metric}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {label}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
};
