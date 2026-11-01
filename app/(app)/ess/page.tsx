import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "My Self-Service" };

const tabs = [
  "Dashboard",
  "Profile",
  "Documents",
  "Timesheets",
  "Attendance",
  "Leave",
  "Policies",
  "Payslips",
];

export default function EssPage() {
  return (
    <div>
      <PageHeader
        title="My Self-Service"
        subtitle="Your personal HR portal — profile, documents, time, leave & pay"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t}
            className={
              "rounded-full px-3 py-1 text-xs font-medium " +
              (i === 0
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>
      <Card className="py-16 text-center text-sm text-muted-foreground">
        No employee profile is linked to your account. Ask your administrator to
        link you to an employee record.
      </Card>
    </div>
  );
}
