import { createUser, getUserByEmail } from "@/app/_actions";
import { RegisterErrors } from "@/enums/errors";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: RegisterErrors.email_already_in_use },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, email, hashedPassword);

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: RegisterErrors.fields_required },
      { status: 500 }
    );
  }
}
