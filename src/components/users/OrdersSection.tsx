/**
 * OrdersSection - Orders and purchases history
 */

"use client";

import React from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Order } from '@/types/user.types';
import { formatDateTime, formatCurrency } from '@/utils/date.utils';
import { EMPTY_MESSAGES } from '@/constants/user.constants';

interface OrdersSectionProps {
  orders: Order[];
}

export function OrdersSection({ orders }: OrdersSectionProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="p-6 pb-4">
        <h2 style={{ color: 'var(--text-primary)' }}>
          Orders & Purchases
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            ({orders.length})
          </span>
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            {EMPTY_MESSAGES.NO_ORDERS}
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Order Number
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Status
              </th>
              <th
                className="text-right px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Amount
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Payment Method
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Created
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Completed
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {order.orderNumber}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {order.id}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge
                    status={order.status}
                    semanticType={order.status === 'Completed' ? 'success' : 'neutral'}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(order.totalAmount, order.currency)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {order.paymentMethod}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatDateTime(order.createdAt)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {order.completedAt ? formatDateTime(order.completedAt) : '—'}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
