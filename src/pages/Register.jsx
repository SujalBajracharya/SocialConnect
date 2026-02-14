import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2 } from 'lucide-react';

// Register page component for new user sign up
const Register = () => {
  // State variables for form fields and UI feedback
  const [name, setName] = useState('');                 // Stores user's full name input
  const [email, setEmail] = useState('');               // Stores user's email input
  const [password, setPassword] = useState('');         // Stores user's password input
  const [confirmPassword, setConfirmPassword] = useState(''); // Stores confirmation password input
  const [error, setError] = useState('');               // Stores error message if registration fails
  const [loading, setLoading] = useState(false);        // Indicates if registration request is in progress

  const { register } = useAuth();                       // Get register function from AuthContext
  const navigate = useNavigate();                       // React Router hook for navigation

  // Handle form submission for registration
  const handleSubmit = async (e) => {
    e.preventDefault();         // Prevent default form submission
    setError('');               // Clear previous errors

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);           // Show loading spinner

    // Attempt registration with provided credentials
    const result = await register(name, email, password);
    
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
      {/* Card container for registration form */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">SocialConnect</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show error alert if registration fails */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Full name input field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
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
            
            {/* Confirm password input field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            {/* Submit button with loading spinner */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>
          
          {/* Link to login page for existing users */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

