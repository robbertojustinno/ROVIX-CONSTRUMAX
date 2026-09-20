export type FiscalDocumentType="NFE"|"NFCE";
export interface FiscalIssueRequest{type:FiscalDocumentType;saleId:number;environment:"HOMOLOGATION"|"PRODUCTION"}
export interface FiscalIssueResult{status:"AUTHORIZED"|"REJECTED"|"PENDING";accessKey?:string;xml?:string;message?:string}
export interface FiscalProvider{issue(input:FiscalIssueRequest):Promise<FiscalIssueResult>;cancel(accessKey:string,reason:string):Promise<FiscalIssueResult>;status():Promise<{online:boolean;message:string}>}
export class FiscalNotConfigured implements FiscalProvider{async issue(){return{status:"REJECTED" as const,message:"Módulo fiscal ainda não homologado"}}async cancel(){return{status:"REJECTED" as const,message:"Módulo fiscal ainda não homologado"}}async status(){return{online:false,message:"Módulo fiscal ainda não configurado"}}}
