/**
 * SSO Metadata Endpoint
 * Returns SAML metadata XML for service provider configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    // Get SSO configuration
    const ssoConfig = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
      include: { organization: true },
    });

    if (!ssoConfig || !ssoConfig.enabled) {
      return NextResponse.json({ error: "SSO not configured" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const entityId = ssoConfig.samlEntityId || `${appUrl}/saml/metadata/${organizationId}`;
    const acsUrl = `${appUrl}/api/auth/sso/callback`;
    const sloUrl = `${appUrl}/api/auth/sso/logout`;

    // Generate SAML metadata XML
    const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${entityId}">
  <SPSSODescriptor
    AuthnRequestsSigned="true"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="1"
      isDefault="true"/>
    <SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="${sloUrl}"/>
    ${ssoConfig.samlCertificate ? `<KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>${ssoConfig.samlCertificate.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----/g, "").trim()}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>` : ""}
  </SPSSODescriptor>
</EntityDescriptor>`;

    return new NextResponse(metadata, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Failed to generate SAML metadata:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
