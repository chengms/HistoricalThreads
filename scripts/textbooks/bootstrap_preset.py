import argparse
import os
import subprocess
import sys


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TB_DIR = os.path.join(ROOT, "scripts", "textbooks")

GEN = os.path.join(TB_DIR, "generate_mappings_skeleton.py")
EXPORT = os.path.join(TB_DIR, "export_mappings_csv.py")


def main() -> None:
    parser = argparse.ArgumentParser(description="一键：生成 mappings 骨架 + 导出 CSV（Excel 友好）。")
    parser.add_argument("--preset", required=True, help="教材预设（例如：grade7_up）")
    parser.add_argument("--out-dir", default=TB_DIR, help="输出目录（默认：scripts/textbooks）")
    parser.add_argument("--csv-only", action="store_true", help="仅导出 CSV（不生成/覆盖 mappings JSON）")
    parser.add_argument("--include-persons", action="store_true", default=True, help="包含相关人物（默认开启）")
    parser.add_argument("--no-include-persons", action="store_false", dest="include_persons", help="不包含人物")
    parser.add_argument("--publisher", default="人民教育出版社", help="出版社（默认：人民教育出版社）")
    args = parser.parse_args()

    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)

    mappings_json = os.path.join(out_dir, f"mappings_{args.preset}.json")
    mappings_csv = os.path.join(out_dir, f"mappings_{args.preset}.csv")

    if not args.csv_only:
        # 1) generate skeleton
        cmd1 = [
            sys.executable,
            GEN,
            "--preset",
            args.preset,
            "--out",
            mappings_json,
            "--publisher",
            args.publisher,
        ]
        if args.include_persons:
            cmd1.append("--include-persons")
        subprocess.check_call(cmd1, cwd=ROOT)
    else:
        if not os.path.exists(mappings_json):
            raise SystemExit(f"--csv-only 需要已有 mappings 文件：{mappings_json}")

    # 2) export csv (excel bom)
    cmd2 = [
        sys.executable,
        EXPORT,
        "--in",
        mappings_json,
        "--out",
        mappings_csv,
        "--excel-bom",
    ]

    subprocess.check_call(cmd2, cwd=ROOT)

    print("[bootstrap_preset] done")
    print("-", f"mappings: {mappings_json}")
    print("-", f"csv: {mappings_csv}")


if __name__ == "__main__":
    main()


