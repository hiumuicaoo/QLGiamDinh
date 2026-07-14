import express from "express";
import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up directories
const TEMPLATES_DIR = path.join(process.cwd(), "templates");
const TRUONG_PHONG_DIR = path.join(TEMPLATES_DIR, "TRUONG_PHONG");
const PHO_TRUONG_PHONG_DIR = path.join(TEMPLATES_DIR, "PHO_TRUONG_PHONG");
const RECORDS_DIR = path.join(process.cwd(), "records");
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "dossiers.json");

// Core database structure
interface Examiner {
  name: string;
  rank: string;
  role: string;
}

interface Dossier {
  id: string;
  field: "DUONGVAN" | "TAILIEU" | "SUNGDAN";
  requestNo: string;
  requestOrg: string;
  requestOrgType: "Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà" | "Khác";
  requestOrgOther: string;
  caseNo: string;       // e.g. "12/GT-26"
  caseNoX: number;      // e.g. 12
  caseNoYY: string;     // e.g. "26"
  receiveDate: string;  // YYYY-MM-DD
  isReceiveDateOpen: boolean;
  summary: string;
  registerNo: string;   // e.g. "12GT0726/511CH"
  registerNoA: number;  // e.g. 12
  decisionNo: string;
  startDate: string;    // YYYY-MM-DD
  isStartDateOpen: boolean;
  endDate: string;      // YYYY-MM-DD
  examiners: Examiner[];
  assistants: string[];
  leaderRank: string;
  leaderName: string;
  leaderRole: "Trưởng phòng" | "Phó Trưởng phòng";
  
  // Dashboard states
  statusGiao: "Đang giao" | "Đã giao";
  statusNoLuu: string;
  statusScan: "Rồi" | "Chưa";
  statusPhanMem: "Rồi" | "Chưa";
  statusSoHoa: "Rồi" | "Chưa";
  statusNopLuu: "Rồi" | "Chưa";
  createdAt: string;
}

// Ensure necessary directories exist
function ensureDirsExist() {
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  if (!fs.existsSync(TRUONG_PHONG_DIR)) fs.mkdirSync(TRUONG_PHONG_DIR, { recursive: true });
  if (!fs.existsSync(PHO_TRUONG_PHONG_DIR)) fs.mkdirSync(PHO_TRUONG_PHONG_DIR, { recursive: true });
  if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  
  // Create folders for fields inside records
  ["DUONGVAN", "TAILIEU", "SUNGDAN"].forEach((field) => {
    const fieldPath = path.join(RECORDS_DIR, field);
    if (!fs.existsSync(fieldPath)) fs.mkdirSync(fieldPath, { recursive: true });
  });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

// Function to generate professional Word templates programmatically
async function createTemplateFile(dirPath: string, fileName: string, title: string, subtitle: string, lines: string[]) {
  const filePath = path.join(dirPath, fileName);
  if (fs.existsSync(filePath)) return;

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
          bold: true,
          size: 24, // 12pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Độc lập - Tự do - Hạnh phúc",
          bold: true,
          size: 22,
          underline: {},
        }),
      ],
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 28, // 14pt
          color: "000000",
        }),
      ],
      spacing: { after: 120 },
    }),
  ];

  if (subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: subtitle,
            italics: true,
            size: 22,
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Add line spaces and main contents
  lines.forEach((line) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
          }),
        ],
        spacing: { after: 120 },
      })
    );
  });

  // Add signature section at the bottom right
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "[Chức vụ lãnh đạo]\n",
          bold: true,
          size: 24,
        }),
        new TextRun({
          text: "[Cấp bậc lãnh đạo] [Họ và tên lãnh đạo]",
          size: 24,
          italics: true,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created template: ${filePath}`);
}

// Initialize all 8 templates for both roles
async function initDefaultTemplates() {
  ensureDirsExist();

  const roles = [
    { name: "TRUONG_PHONG", label: "Trưởng phòng" },
    { name: "PHO_TRUONG_PHONG", label: "Phó Trưởng phòng" },
  ];

  for (const role of roles) {
    const dir = role.name === "TRUONG_PHONG" ? TRUONG_PHONG_DIR : PHO_TRUONG_PHONG_DIR;

    // File 1: B3-THONG KE TAI LIEU CO TRONG HO SO
    await createTemplateFile(
      dir,
      "1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx",
      "Thống kê tài liệu có trong hồ sơ",
      "Số đăng ký: [Số đăng ký]",
      [
        "Hồ sơ giám định số: [Số đăng ký]",
        "Vụ số: [Vụ số]",
        "Nội dung trích yếu: [Trích yếu]",
        "Bảng thống kê chi tiết toàn bộ hồ sơ, tài liệu, mẫu vật nhận bàn giao được lưu giữ phục vụ hoạt động giám định tư pháp.",
      ]
    );

    // File 2: B4-DANH SACH NGUOI NGHIEN CUU HO SO
    await createTemplateFile(
      dir,
      "2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx",
      "Danh sách người nghiên cứu hồ sơ",
      "Số đăng ký: [Số đăng ký]",
      [
        "Hồ sơ giám định số: [Số đăng ký]",
        "Vụ số: [Vụ số]",
        "Nội dung trích yếu: [Trích yếu]",
        "Cán bộ nghiên cứu hồ sơ ký tên cam kết bảo mật nội dung thông tin nghiệp vụ và không làm thất thoát tài liệu hồ sơ giám định.",
      ]
    );

    // File 3: B1-QUYET DINH LAP HO SO
    await createTemplateFile(
      dir,
      "3_B1-QUYET DINH LAP HO SO.docx",
      "Quyết định lập hồ sơ",
      "Quyết định số: [Quyết định lập số]",
      [
        "Hôm nay, ngày [dd] tháng [mm] năm [yyyy],",
        "Tôi: [Cấp bậc lãnh đạo] [Họ và tên lãnh đạo] - Chức vụ: [Chức vụ lãnh đạo]",
        "Căn cứ Quyết định trưng cầu số: [Quyết định trưng cầu số] của [Cơ quan trưng cầu]",
        "Về việc trưng cầu giám định đối với vụ việc số: [Vụ số]",
        "Nội dung trích yếu vụ việc: [Trích yếu]",
        "QUYẾT ĐỊNH:",
        "Điều 1. Lập hồ sơ giám định chính thức phục vụ công tác giám định tư pháp.",
        "Điều 2. Phân công Giám định viên: [Cấp bậc GĐV] [Họ và tên GĐV] - Chức vụ: [Chức vụ GĐV] chịu trách nhiệm chính thực hiện việc giám định.",
      ]
    );

    // File 4: QUYET DINH PHAN CONG
    await createTemplateFile(
      dir,
      "4_QUYET DINH PHAN CONG.docx",
      "Quyết định phân công giám định viên",
      "Số quyết định: [Số vụ x] / QĐ-PC",
      [
        "Hôm nay, ngày [dd] tháng [mm] năm [yyyy]",
        "Căn cứ Quyết định trưng cầu giám định số: [Quyết định trưng cầu số] của [Cơ quan trưng cầu] đối với vụ việc số: [Vụ số]",
        "Xét năng lực nghiệp vụ cán bộ,",
        "Tôi: [Cấp bậc lãnh đạo] [Họ và tên lãnh đạo] - Chức vụ: [Chức vụ lãnh đạo]",
        "QUYẾT ĐỊNH:",
        "Điều 1. Phân công cán bộ thực hiện giám định vụ việc số: [Vụ số]",
        "Danh sách Giám định viên thực hiện:",
        "- Giám định viên chính: [Cấp bậc GĐV 1] [Họ và tên GĐV 1]",
        "[#has_gd_2]- [Cấp bậc GĐV 2] [Họ và tên GĐV 2]        - Giám định viên[/has_gd_2]",
        "Danh sách Trợ lý phối hợp thực hiện:",
        "- Trợ lý chính: [Trợ lý 1]                   - Trợ lý",
        "[#has_tl_2]- [Trợ lý 2]                   - Trợ lý[/has_tl_2]",
        "Điều 2. Thời hạn thực hiện giám định: Từ ngày [Ngày bắt đầu] đến hết ngày [Ngày kết thúc]. Cán bộ được phân công có trách nhiệm thực hiện đúng quy trình chuyên môn.",
      ]
    );

    // File 5: B1-QUYET DINH KET THUC HO SO
    await createTemplateFile(
      dir,
      "5_B1-QUYET DINH KET THUC HO SO.docx",
      "Quyết định kết thúc hồ sơ",
      "Hồ sơ số: [Vụ số]",
      [
        "Căn cứ tiến độ và kết quả giám định vụ việc số: [Vụ số]",
        "Tôi: [Cấp bậc lãnh đạo] [Họ và tên lãnh đạo] - Chức vụ: [Chức vụ lãnh đạo]",
        "QUYẾT ĐỊNH:",
        "Điều 1. Kết thúc hồ sơ giám định đối với vụ việc mang trích yếu: [Trích yếu]",
        "Điều 2. Giám định viên thực hiện: [Cấp bậc GĐV] [Họ và tên GĐV] - Chức vụ: [Chức vụ GĐV] chịu trách nhiệm lưu trữ hồ sơ theo đúng thời hạn quy định.",
      ]
    );

    // File 6: B15-BAN DINH THOI HAN BAO QUAN HO SO
    await createTemplateFile(
      dir,
      "6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx",
      "Bản định thời hạn bảo quản hồ sơ",
      "Số đăng ký: [Số đăng ký]",
      [
        "Hồ sơ giám định vụ việc số: [Vụ số] - Số đăng ký hồ sơ: [Số đăng ký]",
        "Trích yếu nội dung: [Trích yếu]",
        "Căn cứ các thông tư hướng dẫn về lưu trữ hồ sơ nghiệp vụ,",
        "Giám định viên thụ lý: [Cấp bậc GĐV] [Họ và tên GĐV] - Chức vụ: [Chức vụ GĐV] đề xuất:",
        "Định thời hạn bảo quản hồ sơ: Từ năm [yyyy] đến năm [yyyy+60] (Thời hạn lưu trữ 60 năm).",
        "Ý kiến phê duyệt của lãnh đạo đơn vị: [Cấp bậc lãnh đạo] [Họ và tên lãnh đạo]",
      ]
    );

    // File 7: PHIEU CHAM DIEM
    await createTemplateFile(
      dir,
      "7_PHIEU CHAM DIEM.docx",
      "Phiếu chấm điểm hồ sơ giám định",
      "Số đăng ký: [Số đăng ký]",
      [
        "Tên hồ sơ vụ việc số: [Vụ số]",
        "Trích yếu nội dung: [Trích yếu]",
        "Giám định viên thực hiện chính: [Cấp bậc GĐV] [Họ và tên GĐV]",
        "Tiêu chí đánh giá chất lượng hồ sơ lưu trữ:",
        "1. Sự đầy đủ của tài liệu (Thang điểm 10): ..... /10 điểm",
        "2. Tính chính xác pháp lý (Thang điểm 10): ..... /10 điểm",
        "3. Tính thẩm mỹ, bảo quản (Thang điểm 10): ..... /10 điểm",
        "Người chấm điểm (Lãnh đạo đơn vị): [Cấp bậc lãnh đạo] [Họ và tên lãnh đạo]",
      ]
    );

    // File 8: X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx
    await createTemplateFile(
      dir,
      "X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx",
      "Thông báo thông tin về hồ sơ giám định tư pháp",
      "Số đăng ký: [Số đăng ký]",
      [
        "Hôm nay, ngày [dd] tháng [mm] năm [yyyy]",
        "Chúng tôi thông báo thông tin về hồ sơ giám định tư pháp số: [Số đăng ký] (Vụ số: [Vụ số])",
        "Trích yếu nội dung: [Trích yếu]",
        "Giám định viên thụ lý chính: [Cấp bậc GĐV] [Họ và tên GĐV] - Chức vụ: [Chức vụ GĐV]",
        "Thông báo được gửi tới các cơ quan trưng cầu và các đơn vị liên quan để theo dõi kết quả thực hiện.",
      ]
    );
  }
}

// Load dossiers helper
function loadDossiers(): Dossier[] {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save dossiers helper
function saveDossiers(dossiers: Dossier[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dossiers, null, 2), "utf-8");
}

// Date parser utilities
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function parseDMY(dateStr: string) {
  if (!dateStr) return { day: "", month: "", year: "" };
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return { day: parts[2], month: parts[1], year: parts[0] };
  }
  return { day: "", month: "", year: "" };
}

// JSON body parsing middleware
app.use(express.json());

// API: Get dossiers list
app.get("/api/dossiers", (req, res) => {
  const dossiers = loadDossiers();
  res.json(dossiers);
});

// API: Get templates location info
app.get("/api/templates-info", (req, res) => {
  res.json({
    photorongphong: PHO_TRUONG_PHONG_DIR,
    truongphong: TRUONG_PHONG_DIR,
  });
});

// API: Create new dossier and run docx templater
app.post("/api/dossiers", async (req, res) => {
  try {
    const data = req.body;
    const dossiers = loadDossiers();

    // Generate unique ID
    const dossierId = "d_" + Date.now();

    // 1. Calculate dates and variables
    const recD = parseDMY(data.receiveDate);
    const startD = parseDMY(data.startDate);

    // File opening date parameters (based on selected checkbox)
    let openDay = "";
    let openMonth = "";
    let openYear = "";

    if (data.isReceiveDateOpen) {
      openDay = recD.day;
      openMonth = recD.month;
      openYear = recD.year;
    } else {
      openDay = startD.day;
      openMonth = startD.month;
      openYear = startD.year;
    }

    // Calculations for yy_receive and yy_receive_plus_60 for File 6
    const receiveYearNum = parseInt(recD.year, 10) || new Date().getFullYear();
    const receiveYearPlus60Num = receiveYearNum + 60;

    // Create the record representation
    const newDossier: Dossier = {
      id: dossierId,
      field: data.field,
      requestNo: data.requestNo,
      requestOrg: data.requestOrgType === "Khác" ? data.requestOrgOther : data.requestOrgType,
      requestOrgType: data.requestOrgType,
      requestOrgOther: data.requestOrgOther,
      caseNo: data.caseNo,
      caseNoX: data.caseNoX,
      caseNoYY: data.caseNoYY,
      receiveDate: data.receiveDate,
      isReceiveDateOpen: data.isReceiveDateOpen,
      summary: data.summary,
      registerNo: data.registerNo,
      registerNoA: data.registerNoA,
      decisionNo: data.decisionNo,
      startDate: data.startDate,
      isStartDateOpen: data.isStartDateOpen,
      endDate: data.endDate,
      examiners: data.examiners,
      assistants: data.assistants,
      leaderRank: data.leaderRank,
      leaderName: data.leaderName,
      leaderRole: data.leaderRole,
      
      // Default dashboard states
      statusGiao: "Đang giao",
      statusNoLuu: "",
      statusScan: "Chưa",
      statusPhanMem: "Chưa",
      statusSoHoa: "Chưa",
      statusNopLuu: "Chưa",
      createdAt: new Date().toISOString(),
    };

    // 2. Directory names
    // Safe folder name replaces '/' with '-' to avoid directory nesting
    const safeCaseNo = data.caseNo.replace(/\//g, "-");
    const fieldFolder = data.field; // DUONGVAN, TAILIEU, SUNGDAN
    const destCaseDir = path.join(RECORDS_DIR, fieldFolder, safeCaseNo);

    // Create physical folder
    if (!fs.existsSync(destCaseDir)) {
      fs.mkdirSync(destCaseDir, { recursive: true });
    }

    // 3. Copy templates corresponding to leader's role and replace tags
    const srcTemplateDir = data.leaderRole === "Trưởng phòng" ? TRUONG_PHONG_DIR : PHO_TRUONG_PHONG_DIR;
    const templateFiles = [
      "1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx",
      "2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx",
      "3_B1-QUYET DINH LAP HO SO.docx",
      "4_QUYET DINH PHAN CONG.docx",
      "5_B1-QUYET DINH KET THUC HO SO.docx",
      "6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx",
      "7_PHIEU CHAM DIEM.docx",
      "X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx",
    ];

    // Compilation of replace data
    const gdv1 = data.examiners[0] || { name: "", rank: "", role: "" };
    const gdv2 = data.examiners[1] || { name: "", rank: "", role: "" };
    const tl1 = data.assistants[0] || "";
    const tl2 = data.assistants[1] || "";

    const tags = {
      "Quyết định trưng cầu số": data.requestNo,
      "Cơ quan trưng cầu": newDossier.requestOrg,
      "Vụ số": data.caseNo,
      "Số vụ x": data.caseNoX,
      "Trích yếu": data.summary,
      "Số đăng ký": data.registerNo,
      "Quyết định lập số": data.decisionNo,
      "Ngày nhận": formatDateDMY(data.receiveDate),
      "Ngày bắt đầu": formatDateDMY(data.startDate),
      "Ngày kết thúc": formatDateDMY(data.endDate),
      
      "dd": openDay,
      "mm": openMonth,
      "yyyy": openYear,
      
      "yyyy+60": String(receiveYearPlus60Num),

      "Cấp bậc lãnh đạo": data.leaderRank,
      "Họ và tên lãnh đạo": data.leaderName,
      "Chức vụ lãnh đạo": data.leaderRole,

      "Họ và tên GĐV": gdv1.name,
      "Cấp bậc GĐV": gdv1.rank,
      "Chức vụ GĐV": gdv1.role,

      "Cấp bậc GĐV 1": gdv1.rank,
      "Họ và tên GĐV 1": gdv1.name,

      "has_gd_2": data.examiners.length >= 2,
      "Cấp bậc GĐV 2": gdv2.rank,
      "Họ và tên GĐV 2": gdv2.name,

      "Trợ lý 1": tl1,
      "has_tl_2": data.assistants.length >= 2,
      "Trợ lý 2": tl2,
    };

    // Run template replacement for each file
    for (const fileName of templateFiles) {
      const srcFilePath = path.join(srcTemplateDir, fileName);
      const destFilePath = path.join(destCaseDir, fileName);

      if (!fs.existsSync(srcFilePath)) {
        console.warn(`Template file missing: ${srcFilePath}. Re-initializing.`);
        await initDefaultTemplates();
      }

      const content = fs.readFileSync(srcFilePath);
      const zip = new PizZip(content);
      
      // Auto-remove empty rows for 1 GĐV / 1 Trợ lý inside File 4 template XML before rendering
      if (fileName === "4_QUYET DINH PHAN CONG.docx") {
        try {
          const docXmlFile = zip.file("word/document.xml");
          if (docXmlFile) {
            let xmlContent = docXmlFile.asText();
            
            const numExaminers = data.examiners ? data.examiners.length : 0;
            const numAssistants = data.assistants ? data.assistants.length : 0;
            
            const removeParagraphContaining = (xml: string, targetText: string) => {
              const pRegex = /<w:p(?:\s+[^>]*)*?>[\s\S]*?<\/w:p>/g;
              return xml.replace(pRegex, (match) => {
                const plainText = match.replace(/<[^>]+>/g, "");
                if (plainText.includes(targetText)) {
                  return "";
                }
                return match;
              });
            };

            if (numExaminers < 2) {
              xmlContent = removeParagraphContaining(xmlContent, "GĐV 2");
            }
            if (numAssistants < 2) {
              xmlContent = removeParagraphContaining(xmlContent, "Trợ lý 2");
            }

            zip.file("word/document.xml", xmlContent);
          }
        } catch (xmlErr) {
          console.error("Error pre-processing XML for file 4:", xmlErr);
        }
      }

      const doc = new Docxtemplater(zip, {
        delimiters: { start: "[", end: "]" },
        paragraphLoop: true,
        linebreaks: true,
      });

      // Override "Vụ số" for file 4 to only include the number, without the /GT-YY suffix
      const fileTags = { ...tags };
      if (fileName === "4_QUYET DINH PHAN CONG.docx") {
        fileTags["Vụ số"] = String(data.caseNoX);
      }

      doc.render(fileTags);

      const outBuffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      fs.writeFileSync(destFilePath, outBuffer);
    }

    // Save dossier metadata
    dossiers.unshift(newDossier);
    saveDossiers(dossiers);

    res.status(201).json({ success: true, dossier: newDossier });
  } catch (err: any) {
    console.error("Error creating dossier:", err);
    res.status(500).json({ error: err.message || "Không thể tạo hồ sơ" });
  }
});

// API: Update dossier dashboard states
app.put("/api/dossiers/:id", (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const dossiers = loadDossiers();
  
  const index = dossiers.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy hồ sơ" });
  }

  dossiers[index] = {
    ...dossiers[index],
    ...updateData,
  };

  saveDossiers(dossiers);
  res.json({ success: true, dossier: dossiers[index] });
});

// API: Delete a dossier
app.delete("/api/dossiers/:id", (req, res) => {
  const { id } = req.params;
  const dossiers = loadDossiers();
  
  const dossier = dossiers.find((d) => d.id === id);
  if (!dossier) {
    return res.status(404).json({ error: "Không tìm thấy hồ sơ" });
  }

  // Remove physical files and folder
  try {
    const safeCaseNo = dossier.caseNo.replace(/\//g, "-");
    const caseDir = path.join(RECORDS_DIR, dossier.field, safeCaseNo);
    if (fs.existsSync(caseDir)) {
      fs.rmSync(caseDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Error deleting dossier folder:", err);
  }

  const updated = dossiers.filter((d) => d.id !== id);
  saveDossiers(updated);
  res.json({ success: true });
});

// API: Download generated file
app.get("/api/download", (req, res) => {
  const { id, filename } = req.query;
  if (!id || !filename) {
    return res.status(400).json({ error: "Thiếu thông số id hoặc tên file" });
  }

  const dossiers = loadDossiers();
  const dossier = dossiers.find((d) => d.id === id);
  if (!dossier) {
    return res.status(404).json({ error: "Không tìm thấy hồ sơ" });
  }

  const safeCaseNo = dossier.caseNo.replace(/\//g, "-");
  const filePath = path.join(RECORDS_DIR, dossier.field, safeCaseNo, String(filename));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File không tồn tại trên server" });
  }

  res.download(filePath, String(filename));
});

// API: Get generated files list for a case
app.get("/api/dossiers/:id/files", (req, res) => {
  const { id } = req.params;
  const dossiers = loadDossiers();
  const dossier = dossiers.find((d) => d.id === id);
  if (!dossier) {
    return res.status(404).json({ error: "Không tìm thấy hồ sơ" });
  }

  const safeCaseNo = dossier.caseNo.replace(/\//g, "-");
  const caseDir = path.join(RECORDS_DIR, dossier.field, safeCaseNo);

  if (!fs.existsSync(caseDir)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(caseDir);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Không thể đọc thư mục hồ sơ" });
  }
});

// Initialize templates on server startup
initDefaultTemplates()
  .then(() => {
    console.log("Templates fully loaded and initialized.");
  })
  .catch((err) => {
    console.error("Failed to initialize templates:", err);
  });

// Setup Vite Dev Server / Static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
