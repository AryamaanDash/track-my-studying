import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { UserPlus, Mail, Lock } from "lucide-react";
import { prisma } from "../../lib/prisma";


export default function RegisterPage() {
  async function registerUser(formData: FormData) {
    "use server";
    
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    // 1. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Save the user to the database
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    // 3. Send them to the login page
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-50 tracking-tight mb-2">
            Create <span className="text-emerald-500">Account</span>
          </h1>
          <p className="text-neutral-400 text-sm">Sign up to start tracking your hours.</p>
        </div>

        <form action={registerUser} className="space-y-4">
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

          <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <UserPlus className="w-5 h-5" />
            Register
          </button>
        </form>
      </div>
    </div>
  );
}