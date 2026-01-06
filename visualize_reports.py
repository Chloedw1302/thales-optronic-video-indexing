#!/usr/bin/env python3
"""
Visualize entity detection reports using Plotly Express.
"""

import json
import argparse
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd


def load_report(report_path: str) -> dict:
    """Load a JSON report file."""
    with open(report_path, 'r') as f:
        return json.load(f)


def create_timeline_heatmap(report: dict, output_path: str = None):
    """
    Create a timeline heatmap showing entity presence over time.

    Args:
        report: Report dictionary
        output_path: Optional path to save the figure
    """
    # Prepare data for heatmap
    data = []
    for entity_name, entity_data in report['entities'].items():
        for detection in entity_data['detections']:
            data.append({
                'Entity': entity_name,
                'Time (s)': detection['second'],
                'Timestamp': detection['timestamp'],
                'Present': 1 if detection['present'] else 0
            })

    df = pd.DataFrame(data)

    # Create pivot table for heatmap
    pivot = df.pivot(index='Entity', columns='Time (s)', values='Present')

    # Create heatmap
    fig = px.imshow(
        pivot,
        labels=dict(x="Time (seconds)", y="Entity", color="Presence"),
        color_continuous_scale=['white', 'darkgreen'],
        aspect='auto',
        title=f"Entity Detection Timeline - {report['video']}"
    )

    fig.update_xaxes(side="bottom")
    fig.update_layout(
        height=max(400, len(report['entities']) * 50),
        coloraxis_colorbar=dict(
            title="Present",
            tickvals=[0, 1],
            ticktext=["No", "Yes"]
        )
    )

    if output_path:
        fig.write_html(output_path)
        print(f"Timeline heatmap saved to {output_path}")

    fig.show()
    return fig


def create_presence_bar_chart(report: dict, output_path: str = None):
    """
    Create a bar chart showing entity presence percentages.

    Args:
        report: Report dictionary
        output_path: Optional path to save the figure
    """
    data = []
    for entity_name, entity_data in report['entities'].items():
        stats = entity_data['statistics']
        data.append({
            'Entity': entity_name,
            'Presence %': stats['presence_percentage'],
            'Frames with Entity': stats['frames_with_entity'],
            'Total Frames': stats['total_frames_analyzed']
        })

    df = pd.DataFrame(data).sort_values('Presence %', ascending=True)

    fig = px.bar(
        df,
        x='Presence %',
        y='Entity',
        orientation='h',
        title=f"Entity Presence Percentage - {report['video']}",
        labels={'Presence %': 'Presence Percentage (%)', 'Entity': 'Entity'},
        text='Presence %',
        hover_data=['Frames with Entity', 'Total Frames'],
        color='Presence %',
        color_continuous_scale='Viridis'
    )

    fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
    fig.update_layout(
        height=max(400, len(df) * 50),
        showlegend=False,
        xaxis_range=[0, max(df['Presence %']) * 1.15]
    )

    if output_path:
        fig.write_html(output_path)
        print(f"Presence bar chart saved to {output_path}")

    fig.show()
    return fig


def create_gantt_chart(report: dict, output_path: str = None):
    """
    Create a Gantt-like chart showing time ranges for each entity.

    Args:
        report: Report dictionary
        output_path: Optional path to save the figure
    """
    data = []
    for entity_name, entity_data in report['entities'].items():
        for i, time_range in enumerate(entity_data['time_ranges']):
            data.append({
                'Entity': entity_name,
                'Start': time_range['start_second'],
                'Finish': time_range['end_second'],
                'Duration': time_range['duration_seconds'],
                'Range': f"{time_range['start']} - {time_range['end']}"
            })

    df = pd.DataFrame(data)

    fig = px.timeline(
        df,
        x_start='Start',
        x_end='Finish',
        y='Entity',
        color='Entity',
        hover_data=['Range', 'Duration'],
        title=f"Entity Time Ranges - {report['video']}"
    )

    fig.update_yaxes(categoryorder='category ascending')
    fig.update_xaxes(title_text='Time (seconds)')
    fig.update_layout(
        height=max(400, len(report['entities']) * 60),
        showlegend=True
    )

    if output_path:
        fig.write_html(output_path)
        print(f"Gantt chart saved to {output_path}")

    fig.show()
    return fig


def create_comprehensive_dashboard(report: dict, output_path: str = None):
    """
    Create a comprehensive dashboard with multiple visualizations.

    Args:
        report: Report dictionary
        output_path: Optional path to save the figure
    """
    # Prepare data
    presence_data = []
    timeline_data = []

    for entity_name, entity_data in report['entities'].items():
        stats = entity_data['statistics']
        presence_data.append({
            'Entity': entity_name,
            'Presence %': stats['presence_percentage'],
            'Frames': f"{stats['frames_with_entity']}/{stats['total_frames_analyzed']}"
        })

        for detection in entity_data['detections']:
            timeline_data.append({
                'Entity': entity_name,
                'Time (s)': detection['second'],
                'Present': 1 if detection['present'] else 0
            })

    presence_df = pd.DataFrame(presence_data).sort_values('Presence %', ascending=False)
    timeline_df = pd.DataFrame(timeline_data)

    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Entity Presence Percentage',
            'Detection Timeline',
            'Entity Statistics',
            'Presence Over Time'
        ),
        specs=[
            [{'type': 'bar'}, {'type': 'heatmap'}],
            [{'type': 'table'}, {'type': 'scatter'}]
        ],
        row_heights=[0.5, 0.5],
        vertical_spacing=0.12,
        horizontal_spacing=0.1
    )

    # 1. Bar chart (top left)
    fig.add_trace(
        go.Bar(
            y=presence_df['Entity'],
            x=presence_df['Presence %'],
            orientation='h',
            marker_color=presence_df['Presence %'],
            marker_colorscale='Viridis',
            text=presence_df['Presence %'].apply(lambda x: f'{x:.1f}%'),
            textposition='outside',
            showlegend=False,
            hovertemplate='<b>%{y}</b><br>Presence: %{x:.1f}%<extra></extra>'
        ),
        row=1, col=1
    )

    # 2. Heatmap (top right)
    pivot = timeline_df.pivot(index='Entity', columns='Time (s)', values='Present')
    fig.add_trace(
        go.Heatmap(
            z=pivot.values,
            x=pivot.columns,
            y=pivot.index,
            colorscale=[[0, 'white'], [1, 'darkgreen']],
            showscale=False,
            hovertemplate='Entity: %{y}<br>Time: %{x}s<br>Present: %{z}<extra></extra>'
        ),
        row=1, col=2
    )

    # 3. Statistics table (bottom left)
    table_data = []
    for entity_name, entity_data in report['entities'].items():
        stats = entity_data['statistics']
        table_data.append([
            entity_name,
            f"{stats['presence_percentage']:.1f}%",
            f"{stats['frames_with_entity']}/{stats['total_frames_analyzed']}",
            len(entity_data['time_ranges'])
        ])

    fig.add_trace(
        go.Table(
            header=dict(
                values=['<b>Entity</b>', '<b>Presence</b>', '<b>Frames</b>', '<b>Ranges</b>'],
                fill_color='paleturquoise',
                align='left'
            ),
            cells=dict(
                values=list(zip(*table_data)),
                fill_color='lavender',
                align='left'
            )
        ),
        row=2, col=1
    )

    # 4. Line chart showing presence over time (bottom right)
    for entity in timeline_df['Entity'].unique():
        entity_data = timeline_df[timeline_df['Entity'] == entity]
        fig.add_trace(
            go.Scatter(
                x=entity_data['Time (s)'],
                y=entity_data['Present'],
                name=entity,
                mode='lines+markers',
                hovertemplate='<b>%{fullData.name}</b><br>Time: %{x}s<br>Present: %{y}<extra></extra>'
            ),
            row=2, col=2
        )

    # Update layout
    fig.update_xaxes(title_text="Presence %", row=1, col=1)
    fig.update_yaxes(title_text="Entity", row=1, col=1)
    fig.update_xaxes(title_text="Time (s)", row=1, col=2)
    fig.update_yaxes(title_text="Entity", row=1, col=2)
    fig.update_xaxes(title_text="Time (s)", row=2, col=2)
    fig.update_yaxes(title_text="Presence", row=2, col=2, tickvals=[0, 1], ticktext=['No', 'Yes'])

    fig.update_layout(
        title_text=f"Entity Detection Dashboard - {report['video']}",
        height=1000,
        showlegend=True
    )

    if output_path:
        fig.write_html(output_path)
        print(f"Dashboard saved to {output_path}")

    fig.show()
    return fig


def main():
    """Main entry point for visualization."""
    parser = argparse.ArgumentParser(
        description="Visualize entity detection reports",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python visualize_reports.py reports/video_1_report.json
  python visualize_reports.py reports/video_1_report.json -t timeline
  python visualize_reports.py reports/video_1_report.json -t dashboard -o viz/
        """
    )
    parser.add_argument(
        'report',
        type=str,
        help='Path to the report JSON file'
    )
    parser.add_argument(
        '--type', '-t',
        type=str,
        choices=['timeline', 'bar', 'gantt', 'dashboard', 'all'],
        default='dashboard',
        help='Type of visualization to create (default: dashboard)'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='Output directory for HTML files (optional)'
    )

    args = parser.parse_args()

    # Load report
    print(f"Loading report from {args.report}...")
    report = load_report(args.report)

    # Create output directory if specified
    output_dir = None
    if args.output:
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)

    # Generate visualizations
    video_name = Path(report['video']).stem

    if args.type == 'timeline' or args.type == 'all':
        output_path = output_dir / f"{video_name}_timeline.html" if output_dir else None
        create_timeline_heatmap(report, output_path)

    if args.type == 'bar' or args.type == 'all':
        output_path = output_dir / f"{video_name}_presence.html" if output_dir else None
        create_presence_bar_chart(report, output_path)

    if args.type == 'gantt' or args.type == 'all':
        output_path = output_dir / f"{video_name}_gantt.html" if output_dir else None
        create_gantt_chart(report, output_path)

    if args.type == 'dashboard':
        output_path = output_dir / f"{video_name}_dashboard.html" if output_dir else None
        create_comprehensive_dashboard(report, output_path)

    print("\nVisualization complete!")


if __name__ == "__main__":
    main()
