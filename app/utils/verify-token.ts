import { endPoints } from "@/constants/urls";

export const verifyToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  const response = await fetch(endPoints.verifyToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const json = await response.json();
  console.log(json);

  return json.status === "success";
};
