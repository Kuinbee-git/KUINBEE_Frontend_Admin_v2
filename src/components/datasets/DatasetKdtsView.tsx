'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KdtsScorePanel } from './KdtsScorePanel';

interface DatasetKdtsViewProps {
  datasetId: string;
  canEdit?: boolean;
}

export function DatasetKdtsView({ datasetId, canEdit = false }: DatasetKdtsViewProps) {
  const [activeTab, setActiveTab] = useState('scoring');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scoring">KDTS Scoring</TabsTrigger>
          <TabsTrigger value="help">About KDTS</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-4">
          <KdtsScorePanel datasetId={datasetId} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              About KDTS Scoring
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  What is KDTS?
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  KDTS (Kuinbee Data Trust Score) is a 0-100 framework for assessing how safe,
                  reliable, and usable a dataset is across five dimensions:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'Q',
                    name: 'Quality · 30%',
                    description:
                      'Covers schema integrity, completeness, accuracy, uniqueness, and distribution health.',
                  },
                  {
                    key: 'L',
                    name: 'Legal & Compliance · 25%',
                    description:
                      'Covers ownership, resale permission, privacy risk, and jurisdiction fit. A score below 60 is a legal gate.',
                  },
                  {
                    key: 'P',
                    name: 'Provenance · 20%',
                    description:
                      'Covers methodology, source type, transformation lineage, and bias disclosure.',
                  },
                  {
                    key: 'U',
                    name: 'Usability · 15%',
                    description:
                      'Covers joinability, documentation, delivery readiness, and integration ease.',
                  },
                  {
                    key: 'F',
                    name: 'Freshness · 10%',
                    description:
                      'Measures how up-to-date the data is and whether it meets timeliness requirements.',
                  },
                ].map(({ key, name, description }) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-[var(--brand-on-primary)]"
                        style={{ backgroundColor: 'var(--state-info)' }}
                      >
                        {key}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {name}
                        </h5>
                        <p style={{ color: 'var(--text-muted)' }}>{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Scoring
                </h4>
                <p style={{ color: 'var(--text-muted)' }} className="mb-3">
                  Each dimension is scored as a whole number from 0-100. The overall KDTS score
                  weights quality most heavily, followed by legal compliance, provenance, usability,
                  and freshness:
                </p>
                <div
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'var(--status-info-bg)',
                    border: '1px solid var(--status-info-border)',
                  }}
                >
                  <p style={{ color: 'var(--state-info)' }}>
                    KDTS = 0.30Q + 0.25L + 0.20P + 0.15U + 0.10F
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Interpretation
                </h4>
                <ul className="space-y-2" style={{ color: 'var(--text-muted)' }}>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-success)' }}>
                      85-100:
                    </span>
                    <span>Production-grade for machine learning, analytics, and operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-info)' }}>
                      70-84:
                    </span>
                    <span>Business-ready for decision support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-warning)' }}>
                      55-69:
                    </span>
                    <span>Experimental; suitable for research and exploration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-error)' }}>
                      Below 55:
                    </span>
                    <span>Restricted; not recommended for production use</span>
                  </li>
                </ul>
              </div>

              {canEdit && (
                <div
                  className="p-4 rounded-r-lg"
                  style={{
                    borderLeft: '4px solid var(--state-info)',
                    backgroundColor: 'var(--status-info-bg)',
                  }}
                >
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Admin Notes
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    As an admin, you can create and update KDTS scores for datasets. Each update is
                    tracked with a history entry including who made the change and when. You can
                    also update previous scoring entries if needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
