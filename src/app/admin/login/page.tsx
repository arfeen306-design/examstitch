import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  async function handleLogin(formData: FormData) {
    'use server';

    const password = formData.get('password');
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('ADMIN_PASSWORD is not set in environment variables');
    }

    if (password === correctPassword) {
      cookies().set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      redirect('/admin/resources');
    } else {
      redirect('/admin/login?error=invalid');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <ShieldCheck className="w-8 h-8 text-gold-500" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-navy-900 tracking-tight">
            ExamStitch Admin
          </h2>
          <p className="mt-2 text-center text-sm text-navy-500">
            Internal dashboard for managing platform resources
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-navy-50 sm:rounded-2xl sm:px-10">
          <form action={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-700">
                Admin Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-navy-100 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  placeholder="Enter administrator password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Authenticate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
