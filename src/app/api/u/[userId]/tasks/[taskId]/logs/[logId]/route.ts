import { client } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; taskId: string; logId: string }> },
) {
  try {
    const { userId, taskId, logId } = await params;

    if ((await getSessionUserId()) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await client.execute({
      sql: "DELETE FROM task_logs WHERE id = ? AND task_id = ?",
      args: [logId, taskId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 },
    );
  }
}
