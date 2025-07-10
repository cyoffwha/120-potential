import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoogleLogin } from "@react-oauth/google";
import { useState, useEffect } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentialResponse: any) => void;
}

export const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  // Ensure the modal is centered and doesn't close when clicking outside
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Sign in to continue</DialogTitle>
          <DialogDescription className="text-center">
            Please sign in with your Google account to access practice questions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="mb-4 text-center text-muted-foreground">
            <p>120% Potential uses Google for authentication to provide a secure and seamless experience.</p>
          </div>
          <div className="my-4">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={() => alert("Google Login Failed")}
              width="300"
              theme="filled_blue"
              text="continue_with"
              shape="pill"
              logo_alignment="left"
              locale="en"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
