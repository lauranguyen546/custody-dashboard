import { redirect } from 'next/navigation';

export default function ExportPage() {
  // Redirect to main evidence page with export modal open
  redirect('/evidence?export=true');
}
