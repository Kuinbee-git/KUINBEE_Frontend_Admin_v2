"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, User, Building2, Users as UsersIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useCreateSupplierInvite } from "@/hooks";
import type { CreateSupplierInviteRequest, SupplierInviteType } from "@/types";

interface InviteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  email: string;
  supplierInviteType: SupplierInviteType;
  individualName: string;
  companyName: string;
  contactPersonName: string;
  sendEmail: boolean;
}

export function InviteSupplierDialog({ open, onOpenChange }: InviteSupplierDialogProps) {
  const createMutation = useCreateSupplierInvite();
  const [inviteType, setInviteType] = useState<SupplierInviteType>("COMPANY");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      supplierInviteType: "COMPANY",
      individualName: "",
      companyName: "",
      contactPersonName: "",
      sendEmail: true,
    },
  });

  const sendEmail = watch("sendEmail");

  const onSubmit = (data: FormData) => {
    const request: CreateSupplierInviteRequest = {
      email: data.email,
      supplierInviteType: inviteType,
      sendEmail: data.sendEmail,
    };

    if (inviteType === "INDIVIDUAL") {
      request.individualName = data.individualName;
    } else {
      request.companyName = data.companyName;
      request.contactPersonName = data.contactPersonName;
    }

    createMutation.mutate(request, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Invite Supplier</DialogTitle>
          <DialogDescription>
            Send an invitation to a new supplier to register on the platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Supplier Type Selection */}
          <div className="space-y-3">
            <Label>Supplier Type</Label>
            <RadioGroup
              value={inviteType}
              onValueChange={(value: SupplierInviteType) => setInviteType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 flex-1">
                <RadioGroupItem value="COMPANY" id="company" />
                <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  Company
                </Label>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <RadioGroupItem value="INDIVIDUAL" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Individual
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                className="pl-9"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Conditional Fields Based on Type */}
          {inviteType === "INDIVIDUAL" ? (
            <div className="space-y-2">
              <Label htmlFor="individualName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="individualName"
                  placeholder="John Doe"
                  className="pl-9"
                  {...register("individualName", {
                    required: inviteType === "INDIVIDUAL" ? "Full name is required" : false,
                  })}
                />
              </div>
              {errors.individualName && (
                <p className="text-sm text-red-500">{errors.individualName.message}</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    placeholder="Acme Corporation"
                    className="pl-9"
                    {...register("companyName", {
                      required: inviteType === "COMPANY" ? "Company name is required" : false,
                    })}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonName">
                  Contact Person <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactPersonName"
                    placeholder="Jane Smith"
                    className="pl-9"
                    {...register("contactPersonName", {
                      required: inviteType === "COMPANY" ? "Contact person is required" : false,
                    })}
                  />
                </div>
                {errors.contactPersonName && (
                  <p className="text-sm text-red-500">{errors.contactPersonName.message}</p>
                )}
              </div>
            </>
          )}

          {/* Send Email Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="sendEmail" className="text-base">
                Send Email Invitation
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically send invitation email to supplier
              </p>
            </div>
            <Switch
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => {
                register("sendEmail").onChange({ target: { value: checked } });
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
