import { AppointmentDetail } from "@/components/operations/service";

export const metadata = { title: "Appointment" };

export default async function Page({ params }: PageProps<"/appointments/[id]">) {
  const { id } = await params;
  return <AppointmentDetail id={id} />;
}
