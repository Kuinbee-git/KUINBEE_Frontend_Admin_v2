'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KdtsScorePanel } from './KdtsScorePanel';

interface DatasetKdtsViewProps {
  datasetId: string;
  isAdmin?: boolean;
}

export function DatasetKdtsView({ datasetId, isAdmin = false }: DatasetKdtsViewProps) {
  const [activeTab, setActiveTab] = useState('scoring');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scoring">KDTS Scoring</TabsTrigger>
          <TabsTrigger value="help">About KDTS</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-4">
          <KdtsScorePanel datasetId={datasetId} isAdmin={isAdmin} />
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
                  KDTS (Knowledge Data Quality Scoring) is a comprehensive framework for assessing the quality of datasets based on five key dimensions:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'Q',
                    name: 'Completeness & Compliance',
                    description: 'Measures how complete the dataset is and how well it complies with standards and schemas.',
                  },
                  {
                    key: 'L',
                    name: 'Legitimacy & Authority',
                    description: 'Evaluates whether the data comes from legitimate, authoritative sources with proper provenance.',
                  },
                  {
                    key: 'P',
                    name: 'Precision & Accuracy',
                    description: 'Assesses how accurate and precise the data is, including measurement precision and error rates.',
                  },
                  {
                    key: 'U',
                    name: 'Usefulness & Relevance',
                    description: 'Evaluates how useful and relevant the data is for its intended use cases and audiences.',
                  },
                  {
                    key: 'F',
                    name: 'Freshness & Timeliness',
                    description: 'Measures how up-to-date the data is and whether it meets timeliness requirements.',
                  },
                ].map(({ key, name, description }) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-white"
                        style={{ backgroundColor: 'var(--state-info)' }}
                      >
                        {key}
                      </div>
                      <div className="flex-1">
                        <h5
                          className="font-semibold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
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
                  Each dimension is scored from 0-100, and the overall KDTS score is the average of these five scores:
                </p>
                <div
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <p style={{ color: 'var(--state-info)' }}>KDTS = (Q + L + P + U + F) / 5</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Interpretation
                </h4>
                <ul className="space-y-2" style={{ color: 'var(--text-muted)' }}>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-success)' }}>80-100:</span>
                    <span>Excellent quality dataset suitable for most use cases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-info)' }}>60-79:</span>
                    <span>Good quality dataset with minor issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-warning)' }}>40-59:</span>
                    <span>Fair quality dataset with some limitations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold" style={{ color: 'var(--state-error)' }}>Below 40:</span>
                    <span>Poor quality dataset - needs significant improvement</span>
                  </li>
                </ul>
              </div>

              {isAdmin && (
                <div
                  className="p-4 rounded-r-lg"
                  style={{
                    borderLeft: '4px solid var(--state-info)',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  }}
                >
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Admin Notes
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    As an admin, you can create and update KDTS scores for datasets. Each update is tracked with a history entry including who made the change and when. You can also update previous scoring entries if needed.
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
