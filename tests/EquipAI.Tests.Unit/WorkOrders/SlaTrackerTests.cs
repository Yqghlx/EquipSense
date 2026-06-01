using EquipAI.Application.WorkOrders;
using FluentAssertions;

namespace EquipAI.Tests.Unit.WorkOrders;

public class SlaTrackerTests
{
    [Fact]
    public void CalculateDueDate_Critical应为2小时()
    {
        var createdAt = new DateTime(2026, 6, 1, 8, 0, 0, DateTimeKind.Utc);
        var due = SlaTracker.CalculateDueDate("Critical", createdAt);
        due.Should().Be(createdAt.AddHours(2));
    }

    [Fact]
    public void CalculateDueDate_High应为8小时()
    {
        var createdAt = new DateTime(2026, 6, 1, 8, 0, 0, DateTimeKind.Utc);
        var due = SlaTracker.CalculateDueDate("High", createdAt);
        due.Should().Be(createdAt.AddHours(8));
    }

    [Fact]
    public void CalculateDueDate_Medium应为24小时()
    {
        var createdAt = DateTime.UtcNow;
        var due = SlaTracker.CalculateDueDate("Medium", createdAt);
        due.Should().Be(createdAt.AddHours(24));
    }

    [Fact]
    public void CalculateDueDate_Unknown默认应为24小时()
    {
        var createdAt = DateTime.UtcNow;
        var due = SlaTracker.CalculateDueDate("Unknown", createdAt);
        due.Should().Be(createdAt.AddHours(24));
    }

    [Fact]
    public void IsOverdue_超过DueDate应为true()
    {
        var dueDate = DateTime.UtcNow.AddHours(-1);
        SlaTracker.IsOverdue(dueDate).Should().BeTrue();
    }

    [Fact]
    public void IsOverdue_未到DueDate应为false()
    {
        var dueDate = DateTime.UtcNow.AddHours(5);
        SlaTracker.IsOverdue(dueDate).Should().BeFalse();
    }

    [Fact]
    public void GetRemainingText_超过应返回负数分钟()
    {
        var dueDate = DateTime.UtcNow.AddMinutes(-30);
        var text = SlaTracker.GetRemainingText(dueDate);
        text.Should().Contain("逾期");
    }
}
