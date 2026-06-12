'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface RuleSummary {
  total: number;
  active: number;
}

interface ConfigSummary {
  validationRules: RuleSummary;
  fraudRules: RuleSummary;
  documentRules: RuleSummary;
  workflowDefinitions: RuleSummary;
}

interface ConfigSection {
  title: string;
  description: string;
  apiEndpoint: string;
  key: keyof ConfigSummary;
}

const SECTIONS: ConfigSection[] = [
  {
    title: 'Validation Rules',
    description:
      'Dynamic rules evaluated during FNOL intake. Control which policies are accepted based on field-level conditions.',
    apiEndpoint: '/api/validation-rules',
    key: 'validationRules',
  },
  {
    title: 'Fraud Detection Rules',
    description:
      'Velocity, duplicate, and threshold rules that flag suspicious claims automatically.',
    apiEndpoint: '/api/fraud-rules',
    key: 'fraudRules',
  },
  {
    title: 'Document Requirements',
    description:
      'Per claim-type document checklists. Rules are evaluated at claim registration time.',
    apiEndpoint: '/api/document-rules',
    key: 'documentRules',
  },
  {
    title: 'Workflow Definitions',
    description:
      'Configurable state machines defining allowed claim status transitions and role-based access.',
    apiEndpoint: '/api/workflow-definitions',
    key: 'workflowDefinitions',
  },
];

export default function ConfigurationPage() {
  const [summary, setSummary] = useState<ConfigSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [valRes, fraudRes, docRes, wfRes] = await Promise.all([
          fetch('/api/validation-rules'),
          fetch('/api/fraud-rules'),
          fetch('/api/document-rules'),
          fetch('/api/workflow-definitions'),
        ]);
        const [val, fraud, doc, wf] = await Promise.all([
          valRes.json(),
          fraudRes.json(),
          docRes.json(),
          wfRes.json(),
        ]);

        setSummary({
          validationRules: {
            total: val.data?.total ?? 0,
            active: (val.data?.rules ?? []).filter((r: { isActive: boolean }) => r.isActive).length,
          },
          fraudRules: {
            total: fraud.data?.total ?? 0,
            active: (fraud.data?.rules ?? []).filter((r: { isActive: boolean }) => r.isActive).length,
          },
          documentRules: {
            total: doc.data?.total ?? 0,
            active: (doc.data?.rules ?? []).filter((r: { isActive: boolean }) => r.isActive).length,
          },
          workflowDefinitions: {
            total: wf.data?.total ?? 0,
            active: (wf.data?.definitions ?? []).filter((r: { isActive: boolean }) => r.isActive).length,
          },
        });
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        All rules and workflow definitions are stored in the database. No hardcoded logic —
        every engine reads configuration at runtime.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const counts = summary?.[section.key];
          return (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                  {section.description}
                </p>
                <div className="flex items-center gap-4">
                  {loading ? (
                    <div className="h-6 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  ) : (
                    <>
                      <Badge variant="info">{counts?.total ?? 0} rules</Badge>
                      <Badge variant="success">{counts?.active ?? 0} active</Badge>
                    </>
                  )}
                </div>
                <p className="mt-3 font-mono text-xs text-slate-400">{section.apiEndpoint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration API Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-xs">
            {[
              ['POST', '/api/integration/fnol', 'Validate FNOL from IntelliDoc'],
              ['POST', '/api/integration/create-claim', 'Register a claim after validation'],
              ['POST', '/api/integration/upload-documents', 'Upload claim documents'],
              ['GET', '/api/integration/claim-status', 'Get claim status + timeline'],
              ['POST', '/api/integration/processed-results', 'Receive adjudication decision'],
              ['POST', '/api/claims/workflow', 'Manually transition claim workflow'],
            ].map(([method, path, desc]) => (
              <div key={path} className="flex items-start gap-3">
                <Badge variant={method === 'POST' ? 'info' : 'success'}>{method}</Badge>
                <div>
                  <span className="text-slate-700 dark:text-slate-300">{path}</span>
                  <span className="ml-2 text-slate-400">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
