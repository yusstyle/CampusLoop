import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumGateProps {
  feature?: string;
}

export function PremiumGate({ feature = "this feature" }: PremiumGateProps) {
  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      }
    } catch {
      console.error("Failed to initiate premium upgrade");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
        <Crown className="w-10 h-10 text-amber-500" />
      </div>

      <h2 className="text-2xl font-bold mb-3">Premium Feature</h2>
      <p className="text-muted-foreground max-w-sm mb-2">
        {`Access to ${feature} is exclusive to CampusLoop Premium members.`}
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Get Premium for <span className="font-bold text-amber-600">₦1,000/month</span> — paid securely via Interswitch Quickteller.
      </p>

      <div className="space-y-4 w-full max-w-xs">
        <div className="text-left space-y-2 mb-6">
          {[
            "Full access to the social feed",
            "Connect with students campus-wide",
            "Unlock premium study materials",
            "Priority support from lecturers",
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Crown className="w-3 h-3 text-amber-500" />
              </div>
              {item}
            </div>
          ))}
        </div>

        <Button
          onClick={handleUpgrade}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium — ₦1,000/month
        </Button>
      </div>
    </div>
  );
}
