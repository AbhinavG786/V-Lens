import supabase from "../supabase/supabaseClient";
import { randomUUID } from "crypto";

export const uploadInvoiceToSupabase = async (
  fileBuffer: Buffer,
  filename: string,
  orderId: string
): Promise<string> => {
  const uniqueName = `${Date.now()}-${randomUUID()}-${filename}`;

  const { error } = await supabase.storage
    .from("invoices") // bucket name (create it in Supabase dashboard)
    .upload(`${orderId}/${uniqueName}`, fileBuffer, {
      contentType: "application/pdf", // force pdf type
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Generate a public URL
  const { data } = supabase.storage
    .from("invoices")
    .getPublicUrl(`${orderId}/${uniqueName}`);

  return data.publicUrl;
};
