"""
Command-line interface for the Thales entity detection pipeline.
"""

import argparse
from pathlib import Path
from typing import List, Tuple

from thales.config import DEFAULT_FRAME_INTERVAL, DEFAULT_OUTPUT_DIR
from thales.entity_detector import process_video_with_voice
from thales.report_generator import generate_report, generate_summary_report


def find_voice_video_pairs(directory: str = ".") -> List[Tuple[str, str]]:
    """
    Find all pairs of voice files and corresponding video files.
    
    Args:
        directory: Directory to search in
        
    Returns:
        List of (voice_file_path, video_file_path) tuples
    """
    dir_path = Path(directory)
    voice_files = sorted(dir_path.glob("voice_*.txt"))
    
    pairs = []
    for voice_file in voice_files:
        voice_stem = voice_file.stem
        try:
            number = voice_stem.split("_")[1]
        except IndexError:
            print(f"Warning: Could not parse number from {voice_file}")
            continue
        
        video_patterns = [
            dir_path / f"video_{number}.mkv",
            dir_path / f"video_{number}.mp4",
            dir_path / f"video_{number}.avi",
            dir_path / f"video_{number}.mov",
        ]
        
        video_file = None
        for pattern in video_patterns:
            if pattern.exists():
                video_file = pattern
                break
        
        if video_file:
            pairs.append((str(voice_file), str(video_file)))
            print(f"Found pair: {voice_file.name} <-> {video_file.name}")
        else:
            print(f"Warning: No corresponding video found for {voice_file.name}")
    
    return pairs


def process_all_videos(
    directory: str = ".", 
    output_dir: str = DEFAULT_OUTPUT_DIR, 
    interval_seconds: int = DEFAULT_FRAME_INTERVAL
):
    """
    Process all voice/video pairs and generate reports.
    
    Args:
        directory: Directory containing voice and video files
        output_dir: Directory to save reports
        interval_seconds: Interval between video frames to analyze
    """
    print("=" * 60)
    print("Thales - Video Entity Detection Pipeline")
    print("=" * 60)
    
    print("\n1. Finding voice/video pairs...")
    pairs = find_voice_video_pairs(directory)
    
    if not pairs:
        print("No voice/video pairs found!")
        return
    
    print(f"Found {len(pairs)} pair(s) to process\n")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    all_reports = []
    
    for i, (voice_file, video_file) in enumerate(pairs, 1):
        print("=" * 60)
        print(f"Processing pair {i}/{len(pairs)}: {Path(video_file).name}")
        print("=" * 60)
        
        try:
            detection_results = process_video_with_voice(
                video_file, 
                voice_file, 
                interval_seconds=interval_seconds
            )
            
            if not detection_results:
                print(f"Warning: No detection results for {video_file}")
                continue
            
            report_filename = f"{Path(video_file).stem}_report.json"
            report_path = output_path / report_filename
            
            report = generate_report(
                video_file,
                detection_results,
                str(report_path)
            )
            
            all_reports.append(report)
            
            # Print summary
            print(f"\nSummary for {Path(video_file).name}:")
            for entity, data in report["entities"].items():
                stats = data["statistics"]
                print(f"  {entity}:")
                print(f"    Present in {stats['frames_with_entity']}/{stats['total_frames_analyzed']} frames "
                      f"({stats['presence_percentage']:.1f}%)")
                if data["time_ranges"]:
                    print(f"    Time ranges: {len(data['time_ranges'])}")
                    for tr in data["time_ranges"][:3]:
                        print(f"      - {tr['start']} to {tr['end']} ({tr['duration_seconds']}s)")
                    if len(data["time_ranges"]) > 3:
                        print(f"      ... and {len(data['time_ranges']) - 3} more")
            
        except Exception as e:
            print(f"Error processing {video_file}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    if all_reports:
        print("\n" + "=" * 60)
        print("Generating summary report...")
        print("=" * 60)
        
        summary_path = output_path / "summary_report.json"
        summary = generate_summary_report(all_reports, str(summary_path))
        
        print(f"\nSummary:")
        print(f"  Processed {summary['total_videos']} video(s)")
        print(f"  Found {summary['unique_entity_count']} unique entity type(s)")
        print(f"  All entities: {', '.join(summary['all_entities'])}")
    
    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Thales - Process voice transcripts and videos to detect military entities",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m thales                     # Process all files in current directory
  python -m thales -d ./data           # Process files from data directory
  python -m thales -i 10 -o ./reports  # 10-second intervals, output to reports/
        """
    )
    parser.add_argument(
        "--directory", "-d",
        type=str,
        default=".",
        help=f"Directory containing voice and video files (default: current directory)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory for reports (default: {DEFAULT_OUTPUT_DIR}/)"
    )
    parser.add_argument(
        "--interval", "-i",
        type=int,
        default=DEFAULT_FRAME_INTERVAL,
        help=f"Interval between video frames in seconds (default: {DEFAULT_FRAME_INTERVAL})"
    )
    parser.add_argument(
        "--version", "-v",
        action="store_true",
        help="Show version and exit"
    )
    
    args = parser.parse_args()
    
    if args.version:
        from thales import __version__
        print(f"Thales Entity Detection Pipeline v{__version__}")
        return
    
    process_all_videos(
        directory=args.directory,
        output_dir=args.output,
        interval_seconds=args.interval
    )


if __name__ == "__main__":
    main()

