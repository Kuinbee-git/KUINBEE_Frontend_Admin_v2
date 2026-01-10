"use client";

import { Mail, Phone, User, CheckCircle2, XCircle } from "lucide-react";

interface SupplierIdentityContactProps {
  contactPerson: {
    fullName: string;
    position?: string;
    email: string;
    phone: string;
  };
  emailVerified: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export function SupplierIdentityContact({
  contactPerson,
  emailVerified,
  emergencyContact,
}: SupplierIdentityContactProps) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Identity & Contact
      </h2>

      <div className="space-y-6">
        {/* Contact Person */}
        <div>
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Contact Person
          </h3>
          <div className="space-y-3">
            {/* Full Name */}
            <div className="flex items-start gap-3">
              <User
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {contactPerson.fullName}
                </p>
                {contactPerson.position && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {contactPerson.position}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {contactPerson.email}
                  </p>
                  {emailVerified ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: "var(--status-success)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--status-success)" }}
                      >
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle
                        className="h-4 w-4"
                        style={{ color: "var(--status-warning)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--status-warning)" }}
                      >
                        Not Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
              <div className="flex-1">
                <p
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {contactPerson.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        {emergencyContact && (
          <>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />
            <div>
              <h3
                className="text-sm font-medium mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                Emergency Contact
              </h3>
              <div className="space-y-3">
                {/* Emergency Contact Name */}
                <div className="flex items-start gap-3">
                  <User
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {emergencyContact.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {emergencyContact.relationship}
                    </p>
                  </div>
                </div>

                {/* Emergency Contact Phone */}
                <div className="flex items-start gap-3">
                  <Phone
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {emergencyContact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
