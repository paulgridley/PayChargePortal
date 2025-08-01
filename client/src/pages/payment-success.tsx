import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface CheckoutSession {
  id: string;
  customer: string;
  subscription: string;
  amount_total: number;
  customer_details: {
    email: string;
    name?: string;
  };
  metadata: {
    pcnNumber: string;
    vehicleRegistration: string;
  };
}

export default function PaymentSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/checkout-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await apiRequest('GET', `/api/checkout-session?sessionId=${sessionId}`);
      return response.json() as Promise<CheckoutSession>;
    },
    enabled: !!sessionId,
  });
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-neutral-800 mb-4">
              Payment Setup Complete!
            </h1>
            
            <p className="text-lg text-neutral-600 mb-8">
              Your recurring payment plan has been successfully setup. You will be charged £30 a month for the next 3 months.
            </p>

            {session && (
              <div className="bg-neutral-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">PCN Number:</span>
                    <span className="font-medium">{session.metadata.pcnNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Vehicle Registration:</span>
                    <span className="font-medium">{session.metadata.vehicleRegistration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Email:</span>
                    <span className="font-medium">{session.customer_details.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Monthly Payment:</span>
                    <span className="font-medium">£30.00</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-neutral-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">What happens next?</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-800">Email Confirmation</h4>
                    <p className="text-sm text-neutral-600">You'll receive a confirmation email with your payment details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-800">Automatic Payments</h4>
                    <p className="text-sm text-neutral-600">Monthly payments will be processed automatically</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download Receipt</span>
              </Button>
              
              <Link href="/">
                <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Portal</span>
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
