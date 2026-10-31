import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthFrame } from "../../components/common/AuthFrame";
export default function ForgotPassword() {
  return (
    <AuthFrame>
      <div className="auth-form-content">
        <div className="auth-heading">
          <h1>Let’s get you back.</h1>
          <p>Need help accessing your account?</p>
        </div>
        <div className="auth-access-note auth-help-note">
          <Mail size={21} />
          <p>
            Contact your platform admin.
            <span>
              Password-reset emails aren’t connected in this prototype. Your
              admin can help you arrange account recovery.
            </span>
          </p>
        </div>
        <Link className="auth-submit" to="/auth/sign-in">
          <ArrowLeft size={18} />
          Back to sign in
        </Link>
        <p className="auth-switch">
          Exploring the platform? Use a demo workspace on the sign-in page.
        </p>
      </div>
    </AuthFrame>
  );
}
