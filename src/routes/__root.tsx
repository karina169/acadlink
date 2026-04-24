import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import AnnouncementBanner from "@/components/AnnouncementBanner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AcadLink" },
      { name: "description", content: "Past Questions, Courses, Departments, Course Chats and Student Feed for SSU students." },
      { property: "og:title", content: "AcadLink" },
      { property: "og:description", content: "Past Questions, Courses, Departments, Course Chats and Student Feed for SSU students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AcadLink" },
      { name: "twitter:description", content: "Past Questions, Courses, Departments, Course Chats and Student Feed for SSU students." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ZggeJT1nPfZMeUB9r2ek5P2pMM92/social-images/social-1776854563151-1000562611.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ZggeJT1nPfZMeUB9r2ek5P2pMM92/social-images/social-1776854563151-1000562611.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <AnnouncementBanner />
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  );
}
