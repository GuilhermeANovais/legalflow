'use server';

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import s3Client from "@/lib/s3Client";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadDocument(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const file = formData.get("file") as File;
        const clienteId = formData.get("clienteId") as string | null;
        const processoId = formData.get("processoId") as string | null;

        if (!file) throw new Error("Arquivo não encontrado.");
        if (!clienteId && !processoId) throw new Error("É necessário vincular a um Cliente ou Processo.");

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) throw new Error("Configuração S3_BUCKET_NAME ausente.");

        // Gerar um nome de arquivo único
        const fileKey = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Converter File (Blob) para Buffer para o upload
        const buffer = Buffer.from(await file.arrayBuffer());

        // Enviar ao S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Salvar no Banco de Dados
        const novoDocumento = await db.documento.create({
            data: {
                tenantId: userId,
                nomeOriginal: file.name,
                fileKey: fileKey,
                tamanhoBytes: file.size,
                tipoMime: file.type || "application/octet-stream",
                clienteId: clienteId || null,
                processoId: processoId || null,
            }
        });

        return { success: true, documento: novoDocumento };

    } catch (error: any) {
        console.error("[UPLOAD_ERROR]", error);
        return { success: false, error: error.message };
    }
}

export async function getDownloadUrl(fileKey: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Validação básica de segurança (evitar que acessem arquivos de outros)
        if (!fileKey.startsWith(`${userId}/`)) {
            throw new Error("Acesso negado ao arquivo.");
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) throw new Error("Configuração S3_BUCKET_NAME ausente.");

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });

        // Gera uma URL assinada válida por 5 minutos (300 segundos)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        return { success: true, url: signedUrl };

    } catch (error: any) {
        console.error("[DOWNLOAD_ERROR]", error);
        return { success: false, error: error.message };
    }
}

export async function deleteDocument(documentoId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const doc = await db.documento.findUnique({
            where: { id: documentoId, tenantId: userId }
        });

        if (!doc) throw new Error("Documento não encontrado.");

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) throw new Error("Configuração S3_BUCKET_NAME ausente.");

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: doc.fileKey,
        });

        await s3Client.send(command);

        await db.documento.delete({
            where: { id: documentoId }
        });

        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_ERROR]", error);
        return { success: false, error: error.message };
    }
}
