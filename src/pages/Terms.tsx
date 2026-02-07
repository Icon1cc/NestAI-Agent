import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Terms & Conditions</h1>
          <Link to="/" className="text-sm text-primary hover:text-primary/80 font-medium">
            ← Back to app
          </Link>
        </div>

        <div className="nest-card p-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            By using NestAI Agent you agree to use the service responsibly and in compliance with applicable laws.
            Data shown in the app is provided for informational purposes only and should not be treated as legal,
            financial, or real-estate advice.
          </p>
          <p>
            We make reasonable efforts to keep information current, but availability and accuracy are not guaranteed.
            You are responsible for verifying critical details with the property provider or relevant authorities.
          </p>
          <p>
            We respect your privacy: any data you provide is handled according to our privacy practices and only used
            to deliver and improve the service. Do not upload sensitive personal data.
          </p>
          <p>
            NestAI Agent may update these terms over time. Continued use of the app after updates constitutes acceptance
            of the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
}
