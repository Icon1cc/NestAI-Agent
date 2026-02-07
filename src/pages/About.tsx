import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">About NestAI Agent</h1>
          <Link to="/" className="text-sm text-primary hover:text-primary/80 font-medium">
            ← Back to app
          </Link>
        </div>
        <p className="text-lg text-muted-foreground">
          NestAI Agent helps you discover the best neighborhoods and properties by combining rich local data,
          thoughtful AI guidance, and a streamlined map-first experience.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nest-card p-5 space-y-2">
            <h2 className="text-xl font-semibold">What we do</h2>
            <p className="text-sm text-muted-foreground">
              We surface listings, amenities, transit access, and livability signals in one place so you can make
              confident decisions faster.
            </p>
          </div>
          <div className="nest-card p-5 space-y-2">
            <h2 className="text-xl font-semibold">How we work</h2>
            <p className="text-sm text-muted-foreground">
              Our AI chat helps refine your search in natural language, while curated quick filters keep common needs
              one tap away.
            </p>
          </div>
        </div>
        <div className="nest-card p-5 space-y-3">
          <h2 className="text-xl font-semibold">Our commitment</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Transparent, high-quality data sources and scoring.</li>
            <li>Respect for user privacy and responsible AI usage.</li>
            <li>Continuous improvements driven by real-world feedback.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
