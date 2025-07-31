import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, CreditCard, CheckCircle, ArrowRight, Phone } from "lucide-react";



export default function PaymentPortal() {
  const [formData, setFormData] = useState({
    pcnNumber: 'PCN123456789',
    vehicleRegistration: 'AB12CDE',
    email: 'pcn@payment.com',
    penaltyAmount: 90
  });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'vehicleRegistration' 
        ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
        : field === 'penaltyAmount' 
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pcnNumber || !formData.vehicleRegistration || !formData.email || !formData.penaltyAmount || formData.penaltyAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        pcnNumber: formData.pcnNumber,
        vehicleRegistration: formData.vehicleRegistration,
        email: formData.email,
        penaltyAmount: formData.penaltyAmount
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Checkout response:', data);
      
      if (data.url) {
        // Redirect to Stripe Checkout
        console.log('Redirecting to:', data.url);
        
        // Use window.location.assign for better compatibility
        setTimeout(() => {
          window.location.assign(data.url);
        }, 100);
      } else {
        console.error('No URL in response:', data);
        throw new Error('Failed to create checkout session - no URL returned');
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-neutral-800 mb-2">
                    Vehicle and Contact Information
                  </h2>
                  <p className="text-neutral-500">
                    Please provide your PCN details and contact information to set up your recurring payment plan.
                  </p>
                </div>

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

                    <div>
                      <Label htmlFor="penalty-amount" className="text-sm font-medium text-neutral-700 mb-2 block">
                        Penalty Amount (£) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="penalty-amount"
                          type="number"
                          placeholder="90"
                          value={formData.penaltyAmount}
                          onChange={(e) => handleInputChange('penaltyAmount', e.target.value)}
                          className="pl-8"
                          min="1"
                          step="0.01"
                          required
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="text-neutral-500 text-sm">£</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">Total penalty amount to be split across 3 monthly payments</p>
                    </div>

                    <div className="flex items-start space-x-3 mb-6">
                      <Checkbox 
                        id="terms" 
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm text-neutral-600 leading-5">
                        I agree to the Terms and Conditions and authorize recurring payments of £{(formData.penaltyAmount / 3).toFixed(2)} per month for 3 months (total £{formData.penaltyAmount.toFixed(2)}) starting today.
                      </Label>
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
                        <div className="flex items-center justify-center space-x-2">
                          <Lock className="w-5 h-5" />
                          <span>Continue to Secure Checkout</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </form>
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
                    <span className="font-semibold text-neutral-800">£{(formData.penaltyAmount / 3).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-neutral-600">Duration</span>
                    <span className="font-semibold text-neutral-800">3 months</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-neutral-600">Total Amount</span>
                    <span className="font-semibold text-neutral-800">£{formData.penaltyAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold text-neutral-800">
                    <span>First Payment Today</span>
                    <span className="text-blue-600">£{(formData.penaltyAmount / 3).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-neutral-800 mb-3">Payment Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 1 (Today)</span>
                      <span className="font-medium">£{(formData.penaltyAmount / 3).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 2 ({payment2})</span>
                      <span className="font-medium">£{(formData.penaltyAmount / 3).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment 3 ({payment3})</span>
                      <span className="font-medium">£{(formData.penaltyAmount / 3).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


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
