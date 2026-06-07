import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 tracking-wide uppercase">
            Client work, organized
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
            {PRODUCT_NAME}
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
            {PRODUCT_TAGLINE}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-neutral-900 bg-white hover:bg-neutral-50 dark:text-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              Login
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 dark:bg-neutral-700 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">File Versioning</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Automatic version tracking for all deliverables with history</p>
            </div>

            <div className="p-6 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 dark:bg-neutral-700 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Structured Feedback</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Change requests, approvals, and questions in one place</p>
            </div>

            <div className="p-6 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 dark:bg-neutral-700 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Payment Tracking</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Track deposits, milestones, and final payments</p>
            </div>
          </div>

          <div className="mt-16 p-8 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
            <h3 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-neutral-50">Private client portal</h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Share one secure link per project. Clients sign in once on that link — no app install, no freelancer dashboard access.
              Files, feedback, payments, and extra scope requests stay in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
