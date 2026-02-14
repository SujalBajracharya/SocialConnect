import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2 } from 'lucide-react';

// Login page component for user authentication
const Login = () => {
  // State variables for form fields and UI feedback
  const [email, setEmail] = useState('');           // Stores user email input
  const [password, setPassword] = useState('');     // Stores user password input
  const [error, setError] = useState('');           // Stores error message if login fails
  const [loading, setLoading] = useState(false);    // Indicates if login request is in progress

  const { login } = useAuth();                      // Get login function from AuthContext
  const navigate = useNavigate();                   // React Router hook for navigation

  // Handle form submission for login
  const handleSubmit = async (e) => {
    e.preventDefault();         // Prevent default form submission
    setError('');               // Clear previous errors
    setLoading(true);           // Show loading spinner

    // Attempt login with provided credentials
    const result = await login(email, password);
    
    if (result.success) {
      // On success, redirect to feed page
      navigate('/feed');
    } else {
      // On failure, show error message
      setError(result.error);
    }
    
    setLoading(false);          // Hide loading spinner
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Card container for login form */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">SocialConnect</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show error alert if login fails */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Email input field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            {/* Password input field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            {/* Submit button with loading spinner */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          
          {/* Link to registration page */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo account credentials for testing */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Demo accounts:</p>
            <div className="space-y-1 text-xs">
              <p>rahul@mail.com / 1234</p>
              <p>bob@mail.com / 1234</p>
              <p>ram@mail.com / 1234</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

