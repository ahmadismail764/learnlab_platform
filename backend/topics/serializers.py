import datetime
import math
from datetime import timezone
from rest_framework import serializers
from topics.models import Topic, Subtopic, SubtopicMastery

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'description']

    id = serializers.UUIDField(read_only=True)

class SubtopicSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = Subtopic
        fields = ['id', 'topic', 'topic_name', 'name', 'description', 'question_count']

class SubtopicMasterySerializer(serializers.ModelSerializer):
    retrievability = serializers.SerializerMethodField()
    subtopic_name = serializers.CharField(source='subtopic.name', read_only=True)

    class Meta:
        model = SubtopicMastery
        fields = ['id', 'learner', 'subtopic', 'subtopic_name', 'difficulty', 'stability', 'reps', 'lapses', 'state', 'last_review', 'next_review', 'retrievability']
        read_only_fields = ['learner', 'subtopic', 'difficulty', 'stability', 'reps', 'lapses', 'last_review', 'retrievability']

    def get_retrievability(self, obj) -> float:
        if obj.stability is None or obj.last_review is None:
            return 0.0

        now = datetime.now(timezone.utc) # type: ignore
        elapsed_days = (now - obj.last_review).total_seconds() / 86400
        return round(math.exp(math.log(0.9) * elapsed_days / obj.stability), 4)

