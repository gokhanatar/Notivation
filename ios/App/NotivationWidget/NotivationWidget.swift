import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct QuickNoteProvider: TimelineProvider {
    func placeholder(in context: Context) -> QuickNoteEntry {
        QuickNoteEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (QuickNoteEntry) -> Void) {
        completion(QuickNoteEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuickNoteEntry>) -> Void) {
        let entry = QuickNoteEntry(date: Date())
        // Refresh every 6 hours
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Entry

struct QuickNoteEntry: TimelineEntry {
    let date: Date
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(
                    LinearGradient(
                        colors: [Color("WidgetBgStart"), Color("WidgetBgEnd")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundStyle(.white)

                Text("Quick Note")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.9))
            }
        }
        .widgetURL(URL(string: "mindfulnotes://new-note"))
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(
                    LinearGradient(
                        colors: [Color("WidgetBgStart"), Color("WidgetBgEnd")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            HStack(spacing: 0) {
                // Left: Quick Note button
                Link(destination: URL(string: "mindfulnotes://new-note")!) {
                    VStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 32, weight: .medium))
                            .foregroundStyle(.white)
                        Text("New Note")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }

                Divider()
                    .background(.white.opacity(0.3))
                    .padding(.vertical, 16)

                // Middle: Decision
                Link(destination: URL(string: "mindfulnotes://new-note?type=decision")!) {
                    VStack(spacing: 6) {
                        Image(systemName: "scale.3d")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(.white)
                        Text("Decision")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }

                Divider()
                    .background(.white.opacity(0.3))
                    .padding(.vertical, 16)

                // Right: Actions
                Link(destination: URL(string: "mindfulnotes://actions")!) {
                    VStack(spacing: 6) {
                        Image(systemName: "checklist")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(.white)
                        Text("Actions")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - Widget Entry View

struct NotivationWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: QuickNoteProvider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView()
        case .systemMedium:
            MediumWidgetView()
        default:
            SmallWidgetView()
        }
    }
}

// MARK: - Widget Configuration

struct NotivationQuickNoteWidget: Widget {
    let kind: String = "NotivationQuickNote"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuickNoteProvider()) { entry in
            if #available(iOS 17.0, *) {
                NotivationWidgetEntryView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                NotivationWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Quick Note")
        .description("Tap to instantly create a new note in Notivation.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Widget Bundle

@main
struct NotivationWidgetBundle: WidgetBundle {
    var body: some Widget {
        NotivationQuickNoteWidget()
    }
}

// MARK: - Preview

#if DEBUG
struct NotivationWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            NotivationWidgetEntryView(entry: QuickNoteEntry(date: Date()))
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            NotivationWidgetEntryView(entry: QuickNoteEntry(date: Date()))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
#endif
