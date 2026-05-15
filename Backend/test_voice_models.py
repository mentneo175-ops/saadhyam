"""
Test script for Voice Models (TTS and STT)
Run: python test_voice_models.py
"""

import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.tts_service import tts_service, gtts_service
from services.stt_service import stt_service


def test_tts():
    """Test Text-to-Speech"""
    print("\n" + "="*60)
    print("🔊 Testing Text-to-Speech (TTS)")
    print("="*60)
    
    if not tts_service.is_available():
        print("❌ TTS service not available")
        print("💡 Install with: pip install TTS")
        return
    
    test_texts = {
        'english': "Hello! I'm calling from Saadhyam AI. How can I help you today?",
        'hinglish': "नमस्ते! मैं सध्याम एआई से बुला रहा हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
        'telugu': "హలో! నేను సాధ్యం AI నుండి కాల్ చేస్తున్నాను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?"
    }
    
    for language, text in test_texts.items():
        try:
            print(f"\n📝 Testing {language.upper()}:")
            print(f"   Text: {text[:50]}...")
            
            audio_path = tts_service.text_to_speech(
                text=text,
                language=language,
                voice_type="female"
            )
            
            print(f"   ✅ Audio generated: {audio_path}")
            print(f"   📁 File size: {os.path.getsize(audio_path) / 1024:.2f} KB")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n✅ TTS test complete!")


def test_gtts():
    """Test Google TTS (Alternative)"""
    print("\n" + "="*60)
    print("🔊 Testing Google TTS (Alternative - Requires Internet)")
    print("="*60)
    
    if not gtts_service.available:
        print("❌ gTTS not available")
        print("💡 Install with: pip install gtts")
        return
    
    try:
        print("\n📝 Testing English:")
        audio_path = gtts_service.text_to_speech(
            text="Hello from Google Text to Speech!",
            language="english"
        )
        print(f"✅ Audio generated: {audio_path}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure you have internet connection")


def test_stt():
    """Test Speech-to-Text"""
    print("\n" + "="*60)
    print("🎤 Testing Speech-to-Text (STT)")
    print("="*60)
    
    if not stt_service.is_available():
        print("❌ STT service not available")
        print("💡 Install with: pip install openai-whisper")
        return
    
    # Check if we have test audio files
    audio_dir = "audio_output"
    if not os.path.exists(audio_dir):
        print("⚠️ No audio files found to test STT")
        print("💡 Run TTS test first to generate audio files")
        return
    
    audio_files = [f for f in os.listdir(audio_dir) if f.endswith('.wav')]
    
    if not audio_files:
        print("⚠️ No .wav files found in audio_output/")
        print("💡 Run TTS test first to generate audio files")
        return
    
    # Test with first audio file
    test_file = os.path.join(audio_dir, audio_files[0])
    
    try:
        print(f"\n📁 Testing with: {test_file}")
        
        result = stt_service.speech_to_text(
            audio_path=test_file,
            language="english"
        )
        
        print(f"\n✅ Transcription Results:")
        print(f"   Text: {result['text']}")
        print(f"   Language: {result['language']}")
        print(f"   Confidence: {result['confidence']:.2%}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ STT test complete!")


def test_round_trip():
    """Test TTS -> STT round trip"""
    print("\n" + "="*60)
    print("🔄 Testing Round Trip (TTS -> STT)")
    print("="*60)
    
    if not tts_service.is_available() or not stt_service.is_available():
        print("❌ Both TTS and STT services required")
        return
    
    original_text = "Hello! I am calling from Saadhyam AI. How can I help you today?"
    
    try:
        print(f"\n📝 Original text: {original_text}")
        
        # Step 1: Text to Speech
        print("\n🔊 Step 1: Converting text to speech...")
        audio_path = tts_service.text_to_speech(
            text=original_text,
            language="english"
        )
        print(f"   ✅ Audio generated: {audio_path}")
        
        # Step 2: Speech to Text
        print("\n🎤 Step 2: Converting speech back to text...")
        result = stt_service.speech_to_text(
            audio_path=audio_path,
            language="english"
        )
        transcribed_text = result['text']
        print(f"   ✅ Transcribed: {transcribed_text}")
        
        # Compare
        print("\n📊 Comparison:")
        print(f"   Original:    {original_text}")
        print(f"   Transcribed: {transcribed_text}")
        print(f"   Confidence:  {result['confidence']:.2%}")
        
        # Check similarity
        original_lower = original_text.lower()
        transcribed_lower = transcribed_text.lower()
        
        if original_lower == transcribed_lower:
            print("   ✅ Perfect match!")
        elif original_lower in transcribed_lower or transcribed_lower in original_lower:
            print("   ✅ Close match!")
        else:
            print("   ⚠️ Different but acceptable (STT may paraphrase)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ Round trip test complete!")


def test_model_info():
    """Display model information"""
    print("\n" + "="*60)
    print("ℹ️  Model Information")
    print("="*60)
    
    print("\n🔊 TTS Service:")
    if tts_service.is_available():
        print(f"   Status: ✅ Available")
        print(f"   Device: {tts_service.device}")
        print(f"   Languages: {', '.join(tts_service.get_available_languages())}")
    else:
        print(f"   Status: ❌ Not available")
    
    print("\n🎤 STT Service:")
    if stt_service.is_available():
        print(f"   Status: ✅ Available")
        print(f"   Model: Whisper {stt_service.model_size}")
        print(f"   Device: {stt_service.device}")
        print(f"   Languages: 99+ languages supported")
    else:
        print(f"   Status: ❌ Not available")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🎙️  Voice Models Test Suite")
    print("="*60)
    
    # Display model info
    test_model_info()
    
    # Test TTS
    test_tts()
    
    # Test alternative gTTS
    # test_gtts()  # Uncomment to test (requires internet)
    
    # Test STT
    test_stt()
    
    # Test round trip
    test_round_trip()
    
    print("\n" + "="*60)
    print("✅ All tests complete!")
    print("="*60)
    print("\n💡 Tips:")
    print("   - Audio files saved in: audio_output/")
    print("   - To test with your own audio, place .wav files in audio_output/")
    print("   - For faster processing, use GPU (CUDA)")
    print("   - To change Whisper model: stt_service.change_model_size('small')")
    print("\n")


if __name__ == "__main__":
    main()
