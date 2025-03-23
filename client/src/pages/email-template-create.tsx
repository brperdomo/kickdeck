import { useEffect } from "react";
import { useLocation } from "wouter";

export default function EmailTemplateCreate() {
  const [, navigate] = useLocation();
  
  // Redirect to the edit page with 'create' parameter
  useEffect(() => {
    navigate("/admin/email-templates/create");
  }, [navigate]);
  
  return null;
}