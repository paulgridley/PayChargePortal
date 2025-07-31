import { useState, useEffect } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, CreditCard, CheckCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

const PaymentForm = ({ clientSecret, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your recurring payment has been set up successfully!",
        });
        onSuccess();
        setLocation('/payment-success');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <PaymentElement />
      </div>
      
      <div className="flex items-start space-x-3">
        <Checkbox id="terms" required />
        <Label htmlFor="terms" className="text-sm text-neutral-600 leading-5">
          I agree to the Terms and Conditions and authorize recurring payments of £30.00 per month for 3 months (total £90.00) starting today.
        </Label>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-medium"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            <span>Processing payment...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Set Up Recurring Payment - £30.00/month</span>
          </div>
        )}
      </Button>
    </form>
  );
};

export default function PaymentPortal() {
  const [formData, setFormData] = useState({
    pcnNumber: '',
    vehicleRegistration: '',
    email: ''
  });
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: form, 2: payment
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'vehicleRegistration' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pcnNumber || !formData.vehicleRegistration || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        pcnNumber: formData.pcnNumber,
        vehicleRegistration: formData.vehicleRegistration,
        email: formData.email
      });

      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep(2);
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set up payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextPaymentDates = () => {
    const today = new Date();
    const payment2 = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const payment3 = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    return {
      payment2: payment2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      payment3: payment3.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  const { payment2, payment3 } = getNextPaymentDates();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-800">PCN Payment Portal</h1>
                <p className="text-sm text-neutral-500">Secure recurring payment system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                <Lock className="w-4 h-4" />
                <span>SSL Secured</span>
              </div>
              <div className="text-xs text-neutral-500 border-l border-gray-300 pl-4">
                Powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>1</div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${step >= 1 ? 'text-neutral-800' : 'text-gray-500'}`}>
                  Vehicle Details
                </p>
                <p className="text-xs text-neutral-500">Enter your PCN and vehicle information</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-1 bg-gray-200 rounded-full">
                <div className={`h-1 bg-blue-600 rounded-full transition-all duration-300 ${
                  step >= 2 ? 'w-full' : 'w-1/3'
                }`} />
              </div>
            </div>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>2</div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${step >= 2 ? 'text-neutral-800' : 'text-gray-500'}`}>
                  Payment Setup
                </p>
                <p className="text-xs text-gray-400">Configure recurring payment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-neutral-800 mb-2">
                    {step === 1 ? 'Vehicle and Contact Information' : 'Payment Information'}
                  </h2>
                  <p className="text-neutral-500">
                    {step === 1 
                      ? 'Please provide your PCN details and contact information to set up your recurring payment plan.'
                      : 'Complete your payment setup to begin your recurring payment plan.'
                    }
                  </p>
                </div>

                {step === 1 ? (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="pcn-number" className="text-sm font-medium text-neutral-700 mb-2 block">
                        PCN Number *
                      </Label>
                      <div className="relative">
                        <Input
                          id="pcn-number"
                          type="text"
                          placeholder="Enter your PCN number (e.g., PCN123456789)"
                          value={formData.pcnNumber}
                          onChange={(e) => handleInputChange('pcnNumber', e.target.value)}
                          className="pr-10"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <CreditCard className="w-5 h-5 text-neutral-400" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">This can be found on your parking charge notice</p>
                    </div>

                    <div>
                      <Label htmlFor="vehicle-reg" className="text-sm font-medium text-neutral-700 mb-2 block">
                        Vehicle Registration *
                      </Label>
                      <div className="relative">
                        <Input
                          id="vehicle-reg"
                          type="text"
                          placeholder="Enter vehicle registration (e.g., AB12 CDE)"
                          value={formData.vehicleRegistration}
                          onChange={(e) => handleInputChange('vehicleRegistration', e.target.value)}
                          className="pr-10 uppercase"
                          maxLength={8}
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">UK vehicle registration number without spaces</p>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-neutral-700 mb-2 block">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">Payment confirmations and receipts will be sent to this email</p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-medium"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          <span>Setting up payment...</span>
                        </div>
                      ) : (
                        'Continue to Payment'
                      )}
                    </Button>
                  </form>
                ) : (
                  clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm 
                        clientSecret={clientSecret} 
                        onSuccess={() => setStep(3)} 
                      />
                    </Elements>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <CardContent className="p-0">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Payment Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-neutral-600">Monthly Payment</span>
                    <span className="font-semibold text-neutral-800">£30.00</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-neutral-600">Duration</span>
                    <span className="font-semibold text-neutral-800">3 months</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-neutral-600">Total Amount</span>
                    <span className="font-semibold text-neutral-800">£90.00</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold text-neutral-800">
                    <span>First Payment Today</span>
                    <span className="text-blue-600">£30.00</span>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-neutral-800 mb-3">Payment Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 1 (Today)</span>
                      <span className="font-medium">£30.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 2 ({payment2})</span>
                      <span className="font-medium">£30.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 3 ({payment3})</span>
                      <span className="font-medium">£30.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-neutral-800">Security & Trust</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">STRIPE</span>
                    </div>
                    <div className="text-xs text-neutral-600">
                      <div className="font-medium">PCI DSS Compliant</div>
                      <div>Bank-level security</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-neutral-600">
                      <div className="font-medium">SSL Encrypted</div>
                      <div>256-bit encryption</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-neutral-600 mb-2">Need help?</p>
                  <a href="#" className="text-sm text-blue-600 hover:underline flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Contact Support
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <Card className="mt-12 p-6">
          <CardContent className="p-0">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Your Payment is Secure</h3>
              <p className="text-neutral-600">We use industry-standard security measures to protect your information</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-neutral-800 mb-1">Bank-Level Security</h4>
                <p className="text-sm text-neutral-600">256-bit SSL encryption protects your data</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-neutral-800 mb-1">PCI Compliant</h4>
                <p className="text-sm text-neutral-600">Meets all payment card industry standards</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-neutral-800 mb-1">Easy Management</h4>
                <p className="text-sm text-neutral-600">Update or cancel anytime from your dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-neutral-600">&copy; 2025 PCN Payment Portal. All rights reserved.</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-neutral-600 hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="text-neutral-600 hover:text-blue-600">Terms of Service</a>
              <a href="#" className="text-neutral-600 hover:text-blue-600">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
