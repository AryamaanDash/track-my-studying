import { signIn } from "@/auth";
import { Fingerprint, Lock, Mail } from "lucide-react"; 

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-50 tracking-tight mb-2">
            TrackMy<span className="text-emerald-500">Studying</span>
          </h1>
          <p className="text-neutral-400 text-sm">Sign in to log your hours.</p>
        </div>

        {/* Biometric Login (WebAuthn) */}
        <form
          action={async () => {
            "use server";
            await signIn("webauthn", { redirectTo: "/" });
          }}
          className="mb-6"
        >
          <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Fingerprint className="w-5 h-5" />
            Sign in with Passkey
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-neutral-800"></div>
          <span className="text-xs text-neutral-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-neutral-800"></div>
        </div>

        {/* Standard Password Login */}
        <form
          action={async (formData) => {
            "use server";
            
            // We need to import AuthError at the very top of your file to use this:
            // import { AuthError } from "next-auth";
            const { AuthError } = await import("next-auth");

            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/", // Explicitly tell it to go to the dashboard
              });
            } catch (error) {
              if (error instanceof AuthError) {
                // This prints the exact reason for failure to your terminal
                console.error("⚠️ LOGIN FAILED:", error.type);
              }
              
              // Next.js uses errors to trigger redirects under the hood. 
              // We MUST re-throw the error, or the successful redirect will break!
              throw error; 
            }
          }}
          className="space-y-4"
        >
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button type="submit" className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-50 font-semibold py-3 px-4 rounded-xl transition-colors">
            Sign in with Password
          </button>
        </form>
      </div>
    </div>
  );
}