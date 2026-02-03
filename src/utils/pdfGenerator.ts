import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Colaborador } from "@/types/database";

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(day: number, month: number, year: number): string {
  const date = new Date(year, month - 1, day);
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[date.getDay()];
}

function isWeekend(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export async function generateFrequenciaPDF(
  colaboradores: Colaborador[],
  mes: number,
  ano: number,
  mesLabel: string,
  orgaoNome: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const daysInMonth = getDaysInMonth(mes, ano);

  colaboradores.forEach((colaborador, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FOLHA DE FREQUÊNCIA MENSAL", pageWidth / 2, 15, { align: "center" });

    // Órgão e Período
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const orgaoText = colaborador.orgao?.nome || orgaoNome || "Órgão não informado";
    doc.text(`Órgão: ${orgaoText}`, margin, 25);
    doc.text(`Período: ${mesLabel} / ${ano}`, pageWidth - margin, 25, { align: "right" });

    // Dados do Servidor
    doc.setFontSize(9);
    let yPos = 35;
    
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO SERVIDOR", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${colaborador.nome_completo}`, margin, yPos);
    yPos += 5;
    doc.text(`Matrícula: ${colaborador.matricula}`, margin, yPos);
    doc.text(`Cargo: ${colaborador.cargo}`, pageWidth / 2, yPos);
    yPos += 5;
    
    if (colaborador.lotacao?.nome) {
      doc.text(`Lotação: ${colaborador.lotacao.nome}`, margin, yPos);
      yPos += 5;
    }

    const jornada = `Jornada: ${colaborador.jornada_entrada_manha} às ${colaborador.jornada_saida_manha} / ${colaborador.jornada_entrada_tarde} às ${colaborador.jornada_saida_tarde}`;
    doc.text(jornada, margin, yPos);
    yPos += 10;

    // Tabela de Frequência
    const tableData: string[][] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = getDayOfWeek(day, mes, ano);
      const weekend = isWeekend(day, mes, ano);
      
      tableData.push([
        day.toString().padStart(2, "0"),
        dayOfWeek,
        weekend ? "-" : colaborador.jornada_entrada_manha,
        "", // Assinatura entrada manhã
        weekend ? "-" : colaborador.jornada_saida_manha,
        "", // Assinatura saída manhã
        weekend ? "-" : colaborador.jornada_entrada_tarde,
        "", // Assinatura entrada tarde
        weekend ? "-" : colaborador.jornada_saida_tarde,
        "", // Assinatura saída tarde
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [
        ["Dia", "Sem", "Ent. M", "Ass.", "Saí. M", "Ass.", "Ent. T", "Ass.", "Saí. T", "Ass."]
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [30, 64, 124],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 10 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 },
        9: { cellWidth: 20 },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const day = parseInt(tableData[data.row.index][0]);
          if (isWeekend(day, mes, ano)) {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.textColor = [150, 150, 150];
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    // Footer - Assinaturas
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Linha para assinatura do servidor
    const signatureWidth = 60;
    const signatureY = finalY + 15;

    doc.line(margin, signatureY, margin + signatureWidth, signatureY);
    doc.text("Assinatura do Servidor", margin + signatureWidth / 2, signatureY + 4, { align: "center" });

    // Linha para assinatura da chefia
    doc.line(pageWidth - margin - signatureWidth, signatureY, pageWidth - margin, signatureY);
    doc.text("Assinatura da Chefia Imediata", pageWidth - margin - signatureWidth / 2, signatureY + 4, { align: "center" });

    // Data
    doc.text(`Data: ____/____/________`, pageWidth / 2, signatureY + 15, { align: "center" });
  });

  // Download do PDF
  const fileName = `frequencia_${mesLabel.toLowerCase()}_${ano}.pdf`;
  doc.save(fileName);
}
