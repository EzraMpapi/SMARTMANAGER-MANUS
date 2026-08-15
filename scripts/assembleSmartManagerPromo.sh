#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu"
ASSET_DIR="$ROOT/webdev-static-assets"
SHOT_DIR="$ROOT/screenshots"
OUT="$ASSET_DIR/smart-manager-promotional-video-16x9.mp4"

ffmpeg -y \
  -i "$ASSET_DIR/sm_promo_01_problem.mp4" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-root-1786771657525188001-5119.png" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-app-1786771644589469981-7368.png" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-app-1786771644832402469-2478.png" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-root-1786771657525188001-5119.png" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-app-1786771644832402469-2478.png" \
  -loop 1 -t 12 -i "$SHOT_DIR/webdev-preview-app-1786771644589469981-7368.png" \
  -loop 1 -t 12 -i "$ASSET_DIR/smart-manager-official-logo.png" \
  -i "$ASSET_DIR/smart-manager-promotional-narration.wav" \
  -stream_loop -1 -i "$ASSET_DIR/smart-manager-promotional-music.wav" \
  -filter_complex "
    [0:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v0];
    [1:v]scale=1280:720,zoompan=z='min(zoom+0.00035,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v1];
    [2:v]scale=1280:720,zoompan=z='min(zoom+0.00030,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v2];
    [3:v]scale=1280:720,zoompan=z='min(zoom+0.00032,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v3];
    [4:v]scale=1280:720,zoompan=z='min(zoom+0.00028,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v4];
    [5:v]scale=1280:720,zoompan=z='min(zoom+0.00030,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v5];
    [6:v]scale=1280:720,zoompan=z='min(zoom+0.00032,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v6];
    [7:v]scale=650:-1,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0B1120,zoompan=z='min(zoom+0.00028,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1280x720:fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v7];
    [v0][v1]xfade=transition=fade:duration=1:offset=7[x1];
    [x1][v2]xfade=transition=fade:duration=1:offset=18[x2];
    [x2][v3]xfade=transition=fade:duration=1:offset=29[x3];
    [x3][v4]xfade=transition=fade:duration=1:offset=40[x4];
    [x4][v5]xfade=transition=fade:duration=1:offset=51[x5];
    [x5][v6]xfade=transition=fade:duration=1:offset=62[x6];
    [x6][v7]xfade=transition=fade:duration=1:offset=73,subtitles=/home/ubuntu/businesssphere-erp/assets/smart_manager_promo.srt:force_style='FontName=DejaVu Sans,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H8A0B1120,BackColour=&H800B1120,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=48'[video];
    [8:a]volume=1.0[narration];
    [9:a]volume=0.15[music];
    [narration][music]amix=inputs=2:duration=longest:dropout_transition=2[audio]" \
  -map "[video]" -map "[audio]" -t 85 \
  -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart \
  "$OUT"

echo "Created $OUT"
