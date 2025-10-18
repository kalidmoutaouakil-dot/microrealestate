import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le cookie de session pour l'authentification
    const cookies = request.cookies;
    const sessionCookie = cookies.get('connect.sid');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Appeler l'API tenantapi
    const apiUrl = process.env.TENANTAPI_URL || 'http://tenantapi:8080';
    const response = await fetch(`${apiUrl}/tenantapi/interventions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `connect.sid=${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from tenantapi:', errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des interventions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const sessionCookie = cookies.get('connect.sid');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const apiUrl = process.env.TENANTAPI_URL || 'http://tenantapi:8080';
    const response = await fetch(`${apiUrl}/tenantapi/interventions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `connect.sid=${sessionCookie.value}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from tenantapi:', errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'intervention' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
