import { NextResponse } from "next/server";
export function ok(data:unknown,status=200){return NextResponse.json(data,{status});}
export function fail(error:unknown){const msg=error instanceof Error?error.message:"Erro inesperado";const status=msg==="UNAUTHORIZED"?401:msg==="FORBIDDEN"?403:400;return NextResponse.json({error:msg},{status});}
