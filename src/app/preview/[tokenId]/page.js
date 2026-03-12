import { neon } from "@neondatabase/serverless";
import PreviewClient from "./PreviewClient";

// This runs on the server to securely fetch the token details
async function getTokenDetails(tokenId) {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`
    SELECT * FROM checkins 
    WHERE token_id::text = ${tokenId} OR display_token = ${tokenId} 
    LIMIT 1;
  `;
  return result[0];
}

export default async function PreviewPage({ params }) {
  const resolvedParams = await params;
  const tokenData = await getTokenDetails(resolvedParams.tokenId);

  // Send the data straight to the Client component we just made!
  return <PreviewClient tokenData={tokenData} />;
}
