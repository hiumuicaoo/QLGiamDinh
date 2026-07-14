import React, { useState, useEffect } from "react";
import { 
  FileText, 
  FolderPlus, 
  Plus, 
  Trash2, 
  FileCheck, 
  UserPlus, 
  HelpCircle, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Clock, 
  Users, 
  FileDown, 
  TrendingUp, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { Dossier, Examiner } from "./types";

export default function App() {
  // --- STATE VARIABLES ---
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesInfo, setTemplatesInfo] = useState<{ photorongphong: string; truongphong: string } | null>(null);

  // Form Fields State
  const [field, setField] = useState<"DUONGVAN" | "TAILIEU" | "SUNGDAN">("DUONGVAN");
  const [requestNo, setRequestNo] = useState("");
  const [requestOrgType, setRequestOrgType] = useState<"Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà" | "Khác">("Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà");
  const [requestOrgOther, setRequestOrgOther] = useState("");
  
  const [caseNoX, setCaseNoX] = useState<string>("");
  const [receiveDate, setReceiveDate] = useState<string>(() => {
    // Default to today
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [isReceiveDateOpen, setIsReceiveDateOpen] = useState(true); // default selected
  const [summary, setSummary] = useState("");
  const [registerNoA, setRegisterNoA] = useState<string>("");
  const [decisionNo, setDecisionNo] = useState("");

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default to 30 days later
    return d.toISOString().split("T")[0];
  });

  // Dynamic Examiners & Assistants
  const [examiners, setExaminers] = useState<Examiner[]>([
    { name: "", rank: "Thượng úy", role: "Cán bộ" }
  ]);
  const [assistants, setAssistants] = useState<string[]>([""]);

  // Leadership state
  const [leaderRank, setLeaderRank] = useState("Thiếu tá");
  const [leaderName, setLeaderName] = useState("");
  const [leaderRole, setLeaderRole] = useState<"Trưởng phòng" | "Phó Trưởng phòng">("Trưởng phòng");

  // Dashboard filters and UI control
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState<string>("ALL");
  const [expandedDossierId, setExpandedDossierId] = useState<string | null>(null);
  
  // Inline edit state for "Số lưu"
  const [editingNoLuuId, setEditingNoLuuId] = useState<string | null>(null);
  const [tempNoLuuValue, setTempNoLuuValue] = useState("");

  // UI Toast/Feedback messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Constants for selections
  const RANKS_GDV = ["Trung úy", "Thượng úy", "Đại úy", "Thiếu tá", "Trung tá", "Thượng tá"];
  const ROLES_GDV = ["Cán bộ", "Phó Đội trưởng", "Đội trưởng", "Phó Trưởng phòng"];
  const RANKS_LEADER = ["Thiếu tá", "Trung tá", "Thượng tá", "Đại tá"];
  const ROLES_LEADER = ["Trưởng phòng", "Phó Trưởng phòng"];

  // --- AUTOMATIC DERIVATIONS ---

  // 1. Calculate YY based on 15/12 cutoff rule
  const calculateCaseNoYY = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    let targetYear = year;
    // Dec 15th threshold
    if (month === 12 && day >= 15) {
      targetYear = year + 1;
    }
    return String(targetYear).slice(-2);
  };

  const computedYY = calculateCaseNoYY(receiveDate);
  const computedCaseNo = caseNoX ? `${caseNoX}/GT-${computedYY}` : "";

  // 2. Calculate registration number
  const computedRegisterNo = (() => {
    if (!receiveDate) return "";
    const [year, month] = receiveDate.split("-");
    const mm = month || "01";
    const yy = year ? year.slice(-2) : "00";
    const aVal = registerNoA || "a";
    return `${aVal}GT${mm}${yy}/511CH`;
  })();

  // --- MUTUAL EXCLUSIVITY HANDLERS ---
  const handleReceiveDateOpenToggle = (checked: boolean) => {
    if (checked) {
      setIsReceiveDateOpen(true);
      setIsStartDateOpen(false);
    } else {
      setIsReceiveDateOpen(false);
      setIsStartDateOpen(true);
    }
  };

  const handleStartDateOpenToggle = (checked: boolean) => {
    if (checked) {
      setIsStartDateOpen(true);
      setIsReceiveDateOpen(false);
    } else {
      setIsStartDateOpen(false);
      setIsReceiveDateOpen(true);
    }
  };

  // --- FETCH DATA ---
  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dossiers");
      if (res.ok) {
        const data = await res.json();
        setDossiers(data);
      }
    } catch (err) {
      console.error("Error loading dossiers", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesInfo = async () => {
    try {
      const res = await fetch("/api/templates-info");
      if (res.ok) {
        const data = await res.json();
        setTemplatesInfo(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDossiers();
    fetchTemplatesInfo();
  }, []);

  // --- HANDLERS FOR DYNAMIC INPUTS ---
  const handleAddExaminer = () => {
    if (examiners.length < 3) {
      setExaminers([...examiners, { name: "", rank: "Thượng úy", role: "Cán bộ" }]);
    }
  };

  const handleRemoveExaminer = (index: number) => {
    if (examiners.length > 1) {
      setExaminers(examiners.filter((_, idx) => idx !== index));
    }
  };

  const handleExaminerChange = (index: number, key: keyof Examiner, value: string) => {
    const updated = [...examiners];
    updated[index] = { ...updated[index], [key]: value };
    setExaminers(updated);
  };

  const handleAddAssistant = () => {
    if (assistants.length < 2) {
      setAssistants([...assistants, ""]);
    }
  };

  const handleRemoveAssistant = (index: number) => {
    if (assistants.length > 1) {
      setAssistants(assistants.filter((_, idx) => idx !== index));
    } else {
      setAssistants([""]);
    }
  };

  const handleAssistantChange = (index: number, value: string) => {
    const updated = [...assistants];
    updated[index] = value;
    setAssistants(updated);
  };

  // --- SUBMIT COMPLETED DOSSIER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!caseNoX || isNaN(Number(caseNoX))) {
      showToast("Vui lòng nhập Vụ số là một số tự nhiên", "error");
      return;
    }
    if (!registerNoA || isNaN(Number(registerNoA))) {
      showToast("Vui lòng nhập Số đăng ký (a) là một số tự nhiên", "error");
      return;
    }
    if (!requestNo) {
      showToast("Vui lòng nhập số Quyết định trưng cầu", "error");
      return;
    }
    if (requestOrgType === "Khác" && !requestOrgOther.trim()) {
      showToast("Vui lòng nhập tên Cơ quan trưng cầu khác", "error");
      return;
    }
    if (!decisionNo) {
      showToast("Vui lòng nhập Quyết định lập số", "error");
      return;
    }
    if (examiners.some((e) => !e.name.trim())) {
      showToast("Vui lòng nhập đầy đủ họ và tên Giám định viên", "error");
      return;
    }
    if (assistants.some((a) => !a.trim())) {
      showToast("Vui lòng nhập đầy đủ họ và tên Trợ lý", "error");
      return;
    }
    if (!leaderName.trim()) {
      showToast("Vui lòng nhập họ và tên lãnh đạo ký duyệt", "error");
      return;
    }

    const payload = {
      field,
      requestNo,
      requestOrgType,
      requestOrgOther,
      caseNo: computedCaseNo,
      caseNoX: parseInt(caseNoX, 10),
      caseNoYY: computedYY,
      receiveDate,
      isReceiveDateOpen,
      summary,
      registerNo: computedRegisterNo,
      registerNoA: parseInt(registerNoA, 10),
      decisionNo,
      startDate,
      isStartDateOpen,
      endDate,
      examiners,
      assistants,
      leaderRank,
      leaderName,
      leaderRole,
    };

    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Tạo hồ sơ và 8 biểu mẫu thành công!", "success");
        fetchDossiers();
        resetForm();
      } else {
        const err = await res.json();
        showToast(err.error || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Reset form helper
  const resetForm = () => {
    setCaseNoX("");
    setRequestNo("");
    setRequestOrgType("Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà");
    setRequestOrgOther("");
    setSummary("");
    setRegisterNoA("");
    setDecisionNo("");
    setExaminers([{ name: "", rank: "Thượng úy", role: "Cán bộ" }]);
    setAssistants([""]);
    setLeaderName("");
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // --- DASHBOARD UPDATES ---
  const handleToggleState = async (id: string, key: string, currentValue: string) => {
    let newValue = "";
    if (key === "statusGiao") {
      newValue = currentValue === "Đang giao" ? "Đã giao" : "Đang giao";
    } else {
      newValue = currentValue === "Rồi" ? "Chưa" : "Rồi";
    }

    try {
      const res = await fetch(`/api/dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (res.ok) {
        setDossiers(
          dossiers.map((d) => (d.id === id ? { ...d, [key]: newValue } : d))
        );
      }
    } catch (err) {
      showToast("Lỗi cập nhật tình trạng", "error");
    }
  };

  const handleSaveNoLuu = async (id: string) => {
    try {
      const res = await fetch(`/api/dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusNoLuu: tempNoLuuValue }),
      });

      if (res.ok) {
        setDossiers(
          dossiers.map((d) => (d.id === id ? { ...d, statusNoLuu: tempNoLuuValue } : d))
        );
        setEditingNoLuuId(null);
        showToast("Đã lưu Số lưu trữ", "success");
      }
    } catch (err) {
      showToast("Lỗi lưu số lưu trữ", "error");
    }
  };

  const handleDeleteDossier = async (id: string) => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ XÓA VĨNH VIỄN hồ sơ này cùng toàn bộ 8 file kết quả (.docx/.doc) đã lưu trữ trên HDD sda1 (/mnt/storage). Bạn có chắc chắn muốn tiếp tục?")) {
      return;
    }

    try {
      const res = await fetch(`/api/dossiers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDossiers(dossiers.filter((d) => d.id !== id));
        if (expandedDossierId === id) setExpandedDossierId(null);
        showToast("Đã xóa hồ sơ và giải phóng file trên sda1 thành công", "success");
      }
    } catch (err) {
      showToast("Không thể xóa hồ sơ", "error");
    }
  };

  // --- FILTERS ---
  const filteredDossiers = dossiers.filter((d) => {
    const matchField = filterField === "ALL" || d.field === filterField;
    const matchSearch =
      d.caseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.registerNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchField && matchSearch;
  });

  const getFieldNameVietnamese = (f: string) => {
    switch (f) {
      case "DUONGVAN": return "Đường vân";
      case "TAILIEU": return "Tài liệu";
      case "SUNGDAN": return "Súng - đạn";
      default: return f;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans custom-scrollbar">
      {/* Toast Notification */}
      {feedback && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-md animate-fade-in ${
            feedback.type === "success" 
              ? "bg-[#121214] border-emerald-500/30 text-emerald-400" 
              : "bg-[#121214] border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Modern High-Contrast Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#121214] border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded flex items-center justify-center border border-emerald-500/40">
                <FileCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-white">Quản lý hồ sơ giám định</h1>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Forensic Case Management System • Port 3000</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-lg font-mono text-emerald-400 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PORT: 3000 | TAILSCALE enabled
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Template Instructions Banner */}
        <section id="instructions" className="bg-[#121214] rounded-2xl border border-white/10 p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl flex-shrink-0 border border-emerald-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-base font-semibold text-white">Hướng dẫn Cấu hình 8 File Mẫu (Templates) Word</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Khi khởi động, phần mềm sẽ tự động tạo các thư mục lưu mẫu biểu và khởi tạo sẵn dữ liệu mô phỏng. Để sử dụng biểu mẫu cơ quan của riêng bạn, hãy ghi đè 8 file mẫu vào các đường dẫn sau trên máy chủ của bạn:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10">
                  <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ⚠️ BIỂU MẪU DÀNH CHO PHÓ TRƯỞNG PHÒNG
                  </p>
                  <p className="text-xs text-emerald-400 font-mono select-all bg-[#121214] p-2 rounded-md border border-white/5 break-all">
                    {templatesInfo?.photorongphong || "/templates/PHO_TRUONG_PHONG"}
                  </p>
                </div>
                <div className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10">
                  <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ⚠️ BIỂU MẪU DÀNH CHO TRƯỞNG PHÒNG
                  </p>
                  <p className="text-xs text-emerald-400 font-mono select-all bg-[#121214] p-2 rounded-md border border-white/5 break-all">
                    {templatesInfo?.truongphong || "/templates/TRUONG_PHONG"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic pt-1">
                * Lưu ý: Tên file mẫu phải khớp tuyệt đối và chứa các thẻ ngoặc vuông như <code className="bg-[#1A1A1C] px-1 py-0.5 rounded font-mono text-gray-300 border border-white/5">[Số đăng ký]</code>, <code className="bg-[#1A1A1C] px-1 py-0.5 rounded font-mono text-gray-300 border border-white/5">[Vụ số]</code> để công cụ thay thế tự động hoạt động.
              </p>
            </div>
          </div>
        </section>

        {/* Dual Panel Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: FORM FOR ENTRY (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION: FIELD SELECTION */}
              <div className="bg-[#121214] rounded-2xl border border-white/10 p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">1. Lựa chọn Lĩnh vực</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "DUONGVAN", label: "Đường vân", desc: "DUONGVAN" },
                    { id: "TAILIEU", label: "Tài liệu", desc: "TAILIEU" },
                    { id: "SUNGDAN", label: "Súng - đạn", desc: "SUNGDAN" }
                  ].map((fOption) => (
                    <button
                      key={fOption.id}
                      type="button"
                      onClick={() => setField(fOption.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        field === fOption.id 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-semibold" 
                          : "bg-[#1A1A1C] border-white/10 hover:bg-white/5 text-gray-400"
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{fOption.label}</span>
                      <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase">{fOption.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION: THÔNG TIN HỒ SƠ */}
              <div className="bg-[#121214] rounded-2xl border border-white/10 p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">2. Thông tin hồ sơ ban đầu</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quyết định trưng cầu số */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">Quyết định trưng cầu số <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập số quyết định trưng cầu"
                      value={requestNo} 
                      onChange={(e) => setRequestNo(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>

                  {/* Cơ quan trưng cầu */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">Cơ quan trưng cầu <span className="text-red-500">*</span></label>
                    <div className="flex gap-4 items-center py-1">
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="requestOrg"
                          checked={requestOrgType === "Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà"}
                          onChange={() => setRequestOrgType("Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà")}
                          className="accent-emerald-500 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                        />
                        CQCSĐT Công an tỉnh Khánh Hòa
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="requestOrg"
                          checked={requestOrgType === "Khác"}
                          onChange={() => setRequestOrgType("Khác")}
                          className="accent-emerald-500 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                        />
                        Khác
                      </label>
                    </div>

                    {requestOrgType === "Khác" && (
                      <input 
                        type="text" 
                        required
                        placeholder="Nhập tên cơ quan trưng cầu khác"
                        value={requestOrgOther}
                        onChange={(e) => setRequestOrgOther(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all mt-2"
                      />
                    )}
                  </div>

                  {/* Vụ số (Nhập x và tự động hóa yy) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Vụ số (Số tự nhiên x) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="Ví dụ: 12"
                      value={caseNoX} 
                      onChange={(e) => setCaseNoX(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>

                  {/* Tự động tính Vụ Số */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">Vụ số tự động sinh (yy)</label>
                    <div className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C]/65 border border-white/5 rounded-xl font-mono text-emerald-400">
                      {computedCaseNo ? computedCaseNo : "(Chưa xác định)"}
                    </div>
                  </div>

                  {/* Ngày nhận */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">Ngày nhận <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="date" 
                        required
                        value={receiveDate} 
                        onChange={(e) => setReceiveDate(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer whitespace-nowrap bg-white/5 hover:bg-white/10 px-3 py-2.5 rounded-xl border border-white/10 transition-all">
                        <input 
                          type="checkbox"
                          checked={isReceiveDateOpen}
                          onChange={(e) => handleReceiveDateOpenToggle(e.target.checked)}
                          className="accent-emerald-500 text-emerald-500 focus:ring-emerald-500 rounded"
                        />
                        Chọn làm ngày mở hồ sơ
                      </label>
                    </div>
                  </div>

                  {/* Trích yếu */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">Trích yếu nội dung <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="Ví dụ: Giám định dấu vết đường vân thu giữ tại hiện trường vụ trộm cắp tài sản..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                    />
                  </div>

                  {/* Số đăng ký a */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Số đăng ký (Số tự nhiên a) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="Ví dụ: 123"
                      value={registerNoA} 
                      onChange={(e) => setRegisterNoA(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>

                  {/* Số đăng ký hiển thị */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">Số đăng ký tự sinh</label>
                    <div className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C]/65 border border-white/5 rounded-xl font-mono text-emerald-400 truncate">
                      {computedRegisterNo ? computedRegisterNo : "(Chưa xác định)"}
                    </div>
                  </div>

                  {/* Quyết định lập số */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">Quyết định lập số <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập Quyết định lập số"
                      value={decisionNo} 
                      onChange={(e) => setDecisionNo(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: CÔNG TÁC GIÁM ĐỊNH */}
              <div className="bg-[#121214] rounded-2xl border border-white/10 p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">3. Công tác giám định</h3>
                </div>

                {/* THỜI HẠN */}
                <div className="space-y-3 p-4 bg-[#1A1A1C] rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thời hạn giám định</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ngày bắt đầu */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-400">Ngày bắt đầu</label>
                      <input 
                        type="date" 
                        required
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={isStartDateOpen}
                          onChange={(e) => handleStartDateOpenToggle(e.target.checked)}
                          className="accent-emerald-500 text-emerald-500 focus:ring-emerald-500 rounded"
                        />
                        Chọn làm ngày mở hồ sơ
                      </label>
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-400">Ngày kết thúc</label>
                      <input 
                        type="date" 
                        required
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* PHÂN CÔNG GIÁM ĐỊNH VIÊN */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      Giám định viên phân công (Tối đa 3) <span className="text-red-500">*</span>
                    </label>
                    {examiners.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddExaminer}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm GĐV
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {examiners.map((gdv, idx) => (
                      <div key={idx} className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10 space-y-3 relative">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExaminer(idx)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GĐV #{idx + 1} {idx === 0 ? "(Người thứ nhất / Chủ trì)" : ""}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[11px] font-medium text-gray-400">Họ và tên GĐV</label>
                            <input
                              type="text"
                              required
                              placeholder="Nhập họ tên giám định viên"
                              value={gdv.name}
                              onChange={(e) => handleExaminerChange(idx, "name", e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-400">Cấp bậc GĐV</label>
                            <select
                              value={gdv.rank}
                              onChange={(e) => handleExaminerChange(idx, "rank", e.target.value)}
                              className="w-full px-2 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all [&>option]:bg-[#121214] [&>option]:text-white"
                            >
                              {RANKS_GDV.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-400">Chức vụ GĐV</label>
                            <select
                              value={gdv.role}
                              onChange={(e) => handleExaminerChange(idx, "role", e.target.value)}
                              className="w-full px-2 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all [&>option]:bg-[#121214] [&>option]:text-white"
                            >
                              {ROLES_GDV.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHÂN CÔNG TRỢ LÝ */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      Trợ lý phối hợp (Tối đa 2) <span className="text-red-500">*</span>
                    </label>
                    {assistants.length < 2 && (
                      <button
                        type="button"
                        onClick={handleAddAssistant}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm trợ lý
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {assistants.map((assistant, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            required
                            placeholder={`Họ tên Trợ lý ${idx + 1}`}
                            value={assistant}
                            onChange={(e) => handleAssistantChange(idx, e.target.value)}
                            className="w-full px-3 py-1.5 text-sm bg-[#1A1A1C] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                          />
                        </div>
                        {assistants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssistant(idx)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LÃNH ĐẠO KÝ */}
                <div className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lãnh đạo phê duyệt</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-gray-400">Chức vụ lãnh đạo</label>
                      <select
                        value={leaderRole}
                        onChange={(e) => setLeaderRole(e.target.value as any)}
                        className="w-full px-2 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all [&>option]:bg-[#121214] [&>option]:text-white"
                      >
                        {ROLES_LEADER.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-gray-400">Cấp bậc lãnh đạo</label>
                      <select
                        value={leaderRank}
                        onChange={(e) => setLeaderRank(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all [&>option]:bg-[#121214] [&>option]:text-white"
                      >
                        {RANKS_LEADER.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-medium text-gray-400">Họ và tên lãnh đạo</label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ và tên lãnh đạo"
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-[#121214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#10b981] hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/10 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider"
              >
                <FolderPlus className="w-5 h-5" />
                <span>TẠO HỒ SƠ & TỰ ĐỘNG SINH 8 BIỂU MẪU</span>
              </button>
            </form>
          </div>

          {/* RIGHT: DASHBOARD (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SEARCH AND FILTERS */}
            <div className="bg-[#121214] rounded-2xl border border-white/10 p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Tình trạng hồ sơ giám định
                  </h3>
                  <p className="text-xs text-gray-400">Danh sách theo dõi trạng thái bàn giao và lưu trữ</p>
                </div>

                <div className="flex items-center gap-2 bg-[#1A1A1C] p-1 rounded-lg border border-white/5 text-xs w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterField("ALL")}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      filterField === "ALL" ? "bg-[#121214] text-white shadow-md border border-white/5" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterField("DUONGVAN")}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      filterField === "DUONGVAN" ? "bg-[#121214] text-white shadow-md border border-white/5" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Đường vân
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterField("TAILIEU")}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      filterField === "TAILIEU" ? "bg-[#121214] text-white shadow-md border border-white/5" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Tài liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterField("SUNGDAN")}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      filterField === "SUNGDAN" ? "bg-[#121214] text-white shadow-md border border-white/5" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Súng - đạn
                  </button>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Số vụ, Trích yếu, Số đăng ký..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1A1A1C] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* DOSSIERS TABLE CARD */}
            <div className="bg-[#121214] rounded-2xl border border-white/10 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1A1A1C] text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-white/10">
                      <th className="px-4 py-3">Số vụ</th>
                      <th className="px-4 py-3">Trích yếu / Đăng ký</th>
                      <th className="px-4 py-3 text-center">Bàn Giao</th>
                      <th className="px-4 py-3 text-center">Số Lưu</th>
                      <th className="px-4 py-3 text-center">SCAN</th>
                      <th className="px-4 py-3 text-center">PM</th>
                      <th className="px-4 py-3 text-center">Số Hóa</th>
                      <th className="px-4 py-3 text-center">Nộp Lưu</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                          <span className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                          Đang tải dữ liệu hồ sơ...
                        </td>
                      </tr>
                    ) : filteredDossiers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500 font-medium">
                          Chưa có hồ sơ giám định nào được đăng ký.
                        </td>
                      </tr>
                    ) : (
                      filteredDossiers.map((dossier) => {
                        const isExpanded = expandedDossierId === dossier.id;
                        return (
                          <React.Fragment key={dossier.id}>
                            <tr className={`hover:bg-[#1A1A1C]/75 transition-colors cursor-pointer ${isExpanded ? "bg-[#1A1A1C]/40" : ""}`} onClick={() => setExpandedDossierId(isExpanded ? null : dossier.id)}>
                              {/* Số vụ */}
                              <td className="px-4 py-4 font-semibold text-white font-mono">
                                {dossier.caseNo}
                                <span className="block text-[10px] text-gray-500 font-sans font-normal mt-0.5">
                                  {getFieldNameVietnamese(dossier.field)}
                                </span>
                              </td>

                              {/* Trích yếu / Đăng ký */}
                              <td className="px-4 py-4 max-w-[180px]">
                                <p className="text-xs text-gray-300 font-medium line-clamp-1" title={dossier.summary}>
                                  {dossier.summary}
                                </p>
                                <span className="block text-[11px] text-gray-500 font-mono mt-0.5">
                                  {dossier.registerNo}
                                </span>
                              </td>

                              {/* Tình trạng giao */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleState(dossier.id, "statusGiao", dossier.statusGiao)}
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
                                    dossier.statusGiao === "Đã giao"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {dossier.statusGiao}
                                </button>
                              </td>

                              {/* Số lưu */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                {editingNoLuuId === dossier.id ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <input
                                      type="text"
                                      value={tempNoLuuValue}
                                      onChange={(e) => setTempNoLuuValue(e.target.value)}
                                      className="w-16 px-1.5 py-0.5 text-xs bg-[#1A1A1C] border border-white/20 text-white rounded focus:outline-none focus:border-emerald-500"
                                      placeholder="Số..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveNoLuu(dossier.id)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : dossier.statusNoLuu ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-mono font-medium text-emerald-400 text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{dossier.statusNoLuu}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingNoLuuId(dossier.id);
                                        setTempNoLuuValue(dossier.statusNoLuu);
                                      }}
                                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoLuuId(dossier.id);
                                      setTempNoLuuValue("");
                                    }}
                                    className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-[11px] font-medium transition-all cursor-pointer"
                                  >
                                    Thêm
                                  </button>
                                )}
                              </td>

                              {/* SCAN */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleState(dossier.id, "statusScan", dossier.statusScan)}
                                  className={`w-12 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                                    dossier.statusScan === "Rồi"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-[#1A1A1C] text-gray-500 border-white/10 hover:bg-[#1A1A1C]/70"
                                  }`}
                                >
                                  {dossier.statusScan}
                                </button>
                              </td>

                              {/* Nhập phần mềm */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleState(dossier.id, "statusPhanMem", dossier.statusPhanMem)}
                                  className={`w-12 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                                    dossier.statusPhanMem === "Rồi"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-[#1A1A1C] text-gray-500 border-white/10 hover:bg-[#1A1A1C]/70"
                                  }`}
                                >
                                  {dossier.statusPhanMem}
                                </button>
                              </td>

                              {/* Số hoá */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleState(dossier.id, "statusSoHoa", dossier.statusSoHoa)}
                                  className={`w-12 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                                    dossier.statusSoHoa === "Rồi"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-[#1A1A1C] text-gray-500 border-white/10 hover:bg-[#1A1A1C]/70"
                                  }`}
                                >
                                  {dossier.statusSoHoa}
                                </button>
                              </td>

                              {/* Nộp lưu */}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleState(dossier.id, "statusNopLuu", dossier.statusNopLuu)}
                                  className={`w-12 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                                    dossier.statusNopLuu === "Rồi"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-[#1A1A1C] text-gray-500 border-white/10 hover:bg-[#1A1A1C]/70"
                                  }`}
                                >
                                  {dossier.statusNopLuu}
                                </button>
                              </td>

                              {/* Delete button */}
                              <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDossier(dossier.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                                  title="Xóa hồ sơ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Details Row displaying files */}
                            {isExpanded && (
                              <tr className="bg-[#1A1A1C]/25">
                                <td colSpan={9} className="px-6 py-4 border-t border-b border-white/10">
                                  <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-white/5">
                                      <div>
                                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">📂 8 BIỂU MẪU ĐÃ SINH TỰ ĐỘNG CHO VỤ SỐ: {dossier.caseNo}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Click vào biểu tượng để tải trực tiếp file .docx/.doc đã điền đủ thông tin</p>
                                      </div>
                                      <div className="text-xs text-gray-400 font-mono">
                                        Thư mục lưu trữ trên Server: <code className="bg-[#1A1A1C] px-2 py-1 rounded border border-white/10 text-emerald-400 font-bold">records/{dossier.field}/{dossier.caseNo.replace(/\//g, "-")}</code>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {[
                                        { name: "1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx", desc: "Thống kê tài liệu" },
                                        { name: "2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx", desc: "Người nghiên cứu HS" },
                                        { name: "3_B1-QUYET DINH LAP HO SO.docx", desc: "Quyết định lập hồ sơ" },
                                        { name: "4_QUYET DINH PHAN CONG.docx", desc: "Quyết định phân công GĐV" },
                                        { name: "5_B1-QUYET DINH KET THUC HO SO.docx", desc: "Quyết định kết thúc HS" },
                                        { name: "6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx", desc: "Bản định thời hạn bảo quản" },
                                        { name: "7_PHIEU CHAM DIEM.docx", desc: "Phiếu chấm điểm" },
                                        { name: "X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx", desc: "Thông báo thông tin HS" }
                                      ].map((fileObj) => (
                                        <a
                                          key={fileObj.name}
                                          href={`/api/download?id=${dossier.id}&filename=${encodeURIComponent(fileObj.name)}`}
                                          className="flex items-center gap-3 p-3 bg-[#1A1A1C] border border-white/10 rounded-xl hover:border-emerald-500 hover:bg-white/5 group transition-all"
                                          download
                                        >
                                          <div className="p-2 bg-[#121214] text-gray-400 group-hover:bg-[#10b981]/10 group-hover:text-emerald-400 rounded-lg flex-shrink-0 transition-colors">
                                            <FileDown className="w-5 h-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-300 truncate group-hover:text-white font-sans" title={fileObj.name}>
                                              {fileObj.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                              {fileObj.desc}
                                            </p>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                    
                                    {/* Additional info metadata */}
                                    <div className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-gray-300 font-medium">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                        <div>
                                          <span className="text-gray-500 font-normal">Trưng cầu số:</span> {dossier.requestNo}
                                        </div>
                                        <div>
                                          <span className="text-gray-500 font-normal">Cơ quan TC:</span> {dossier.requestOrg}
                                        </div>
                                        <div>
                                          <span className="text-gray-500 font-normal">Giám định viên:</span> {dossier.examiners.map(e => `${e.rank} ${e.name}`).join(", ")}
                                        </div>
                                        <div>
                                          <span className="text-gray-500 font-normal">Lãnh đạo ký:</span> {dossier.leaderRank} {dossier.leaderName} ({dossier.leaderRole})
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDossier(dossier.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center shadow-lg hover:shadow-rose-500/5"
                                        title="Xóa hồ sơ này và toàn bộ files kết quả đã ghi trên ổ HDD sda1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa hồ sơ & sda1 files
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </main>

      <footer className="bg-[#121214] border-t border-white/5 py-8 mt-16 text-center text-gray-500 text-xs">
        <p className="max-w-7xl mx-auto px-4 font-mono">
          Phần mềm Quản lý hồ sơ giám định tư pháp • Thiết kế theo đặc thù nghiệp vụ Đường vân, Tài liệu, Súng - đạn.
        </p>
        <p className="mt-1">
          Hỗ trợ xuất biểu mẫu tự động chính xác theo chức danh lãnh đạo Trưởng phòng & Phó trưởng phòng.
        </p>
      </footer>
    </div>
  );
}
