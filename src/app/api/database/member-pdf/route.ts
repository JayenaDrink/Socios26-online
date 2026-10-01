import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, SEASON_TABLES, Season } from '@/lib/supabase';
import { buildMemberPdf } from '@/lib/memberPdf';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import nl from '@/locales/nl.json';

const LOCALES = { es, fr, nl } as const;

// GET /api/database/member-pdf?season=2026&id=123&lang=es[&download=1]
// Returns the member's sign-up form as a PDF (inline to view/print, or as a download)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const season = params.get('season') || '2026';
  const id = Number(params.get('id'));
  const langParam = (params.get('lang') || 'es').slice(0, 2) as keyof typeof LOCALES;
  const lang = langParam in LOCALES ? langParam : 'es';
  const download = params.get('download') === '1';

  if (!(season in SEASON_TABLES) || !Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid season or id' }, { status: 400 });
  }

  try {
    const member = await getDatabaseService().getSeasonMemberById(season as Season, id);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const loc = LOCALES[lang] as unknown as {
      memberForm: Record<string, string>;
      pdf: Record<string, string>;
      addMember: Record<string, string>;
    };
    const listName = season === '2026' ? loc.addMember.database2026 : loc.addMember.database2027;
    const bytes = await buildMemberPdf(member, { memberForm: loc.memberForm, pdf: loc.pdf }, listName);

    const name = `${member.last_name || ''}_${member.first_name || ''}`
      .normalize('NFKD').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
    const filename = `inscripcion_${member.member_number || id}_${name || 'socio'}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error building member PDF:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to build PDF' },
      { status: 500 }
    );
  }
}
